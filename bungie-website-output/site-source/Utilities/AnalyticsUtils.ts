import ReactGA from "react-ga";
import BungieAnalytics from "@bungie/analytics";
import { DestroyCallback } from "@Global/DataStore";
import { GlobalStateDataStore } from "@Global/DataStore/GlobalStateDataStore";
import { Localizer } from "@Global/Localizer";
import { SystemNames } from "@Global/SystemNames";
import moment from "moment/moment";
import { ConfigUtils } from "./ConfigUtils";
import { UserUtils } from "./UserUtils";
import { StringUtils } from "./StringUtils";
import { SessionStorageUtils } from "./StorageUtils";

interface ISession {
  sessionId: string;
  refreshDate: moment.Moment;
}

export class AnalyticsUtils {
  private static destroyLoggedInUserObserver: DestroyCallback;

  private static initSuccess = false;

  private static userId = undefined;

  private static initOnce() {
    if (AnalyticsUtils.initSuccess) {
      return;
    }

    const reactGaTestMode = !ConfigUtils.SystemStatus(
      SystemNames.GoogleAnalytics
    );

    const hasConsent =
      UserUtils.CookieConsentIsEnabled() && UserUtils.CookieConsentIsCurrent();

    if (hasConsent) {
      ReactGA.initialize("UA-5262186-1", {
        testMode: reactGaTestMode,
        debug: reactGaTestMode,
        useExistingGa: true,
      } as any); // todo $jlauer - remove "as any" once react-ga supports useExistingGa in its types
      if (ConfigUtils.SystemStatus(SystemNames.BungieAnalytics)) {
        ReactGA.ga((tracker) => {
          const clientId = tracker.get("clientId");
          window["BungieAnalytics"] = new BungieAnalytics(
            "net_bungie_www",
            clientId
          );
          window["BungieAnalytics"].setUserId(AnalyticsUtils.userId);
          ReactGA.set({ userId: AnalyticsUtils.userId });
        });
      }

      AnalyticsUtils.destroyLoggedInUserObserver = GlobalStateDataStore.observe(
        (data) => {
          const userId = data?.loggedInUser?.user?.membershipId;
          if (userId && userId !== AnalyticsUtils.userId) {
            AnalyticsUtils.onUserLoggedIn(userId);
          }
          if (!userId && AnalyticsUtils.userId) {
            AnalyticsUtils.onUserLoggedOut();
          }
        },
        ["loggedInUser"]
      );

      AnalyticsUtils.initSuccess = true;
    }
  }

  private static onUserLoggedIn(userId: string) {
    AnalyticsUtils.userId = userId;
    ReactGA.set({ userId: userId });
    window["BungieAnalytics"]?.setUserId(userId);
  }

  private static onUserLoggedOut() {
    AnalyticsUtils.userId = undefined;
    ReactGA.set({ userId: undefined });
    window["BungieAnalytics"]?.setUserId(undefined);
  }

  /** Tracks the current page to Google Analytics */
  public static trackPage() {
    AnalyticsUtils.initOnce();

    if (
      UserUtils.CookieConsentIsEnabled() &&
      UserUtils.CookieConsentIsCurrent()
    ) {
      ReactGA.pageview(window.location.pathname + window.location.search);
    }

    AnalyticsUtils.trackSession();
  }

  public static trackSession() {
    if (!ConfigUtils.SystemStatus("SessionTracking")) {
      return;
    }

    const timeout = ConfigUtils.GetParameter(
      "SessionTracking",
      "SessionTimeoutSeconds",
      1800
    );

    const existingSessionItem = SessionStorageUtils.getItem("Session");
    if (existingSessionItem) {
      const now = moment();
      const existingSessionObj = JSON.parse(existingSessionItem);
      const existingSession: ISession = {
        sessionId: existingSessionObj.sessionId,
        refreshDate: moment(existingSessionObj.refreshDate),
      };

      if (existingSession.refreshDate.isBefore(now.add(-timeout, "seconds"))) {
        this.createOrUpdateSession();
      } else {
        this.createOrUpdateSession(existingSession.sessionId);
      }
    } else {
      this.createOrUpdateSession();
    }
  }

  private static createOrUpdateSession(existingSessionId?: string) {
    const newSession: ISession = {
      sessionId: existingSessionId || StringUtils.generateGuid(),
      refreshDate: moment(),
    };

    SessionStorageUtils.setItem("Session", JSON.stringify(newSession));
  }
}
