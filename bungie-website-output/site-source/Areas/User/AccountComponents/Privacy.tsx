// Created by larobinson, 2021
// Copyright Bungie, Inc.

import { ConvertToPlatformError } from "@ApiIntermediary";
import { ClanInviteDataStore } from "@Areas/User/AccountComponents/DataStores/ClanInviteDataStore";
import { ClanInviteCheckboxes } from "@Areas/User/AccountComponents/Internal/ClanInviteCheckboxes";
import { PrivacySelect } from "@Areas/User/AccountComponents/Internal/PrivacySelect";
import { useDataStore } from "@bungie/datastore/DataStoreHooks";
import { GlobalStateDataStore } from "@Global/DataStore/GlobalStateDataStore";
import { Localizer } from "@bungie/localization";
import { Contract, Platform } from "@Platform";
import { Button } from "@UIKit/Controls/Button/Button";
import { Modal } from "@UIKit/Controls/Modal/Modal";
import { Toast } from "@UIKit/Controls/Toast/Toast";
import { FormikCheckbox } from "@UIKit/Forms/FormikForms/FormikCheckbox";
import { Grid, GridCol, GridDivider } from "@UIKit/Layout/Grid/Grid";
import { EnumUtils } from "@Utilities/EnumUtils";
import { UserUtils } from "@Utilities/UserUtils";
import classNames from "classnames";
import { Form, Formik, FormikProps, FormikValues } from "formik";
import React, { useEffect, useState } from "react";
import { BNetAccountPrivacy } from "@Enum";
import { ObjectUtils } from "../../../Utilities/ObjectUtils";
import { SaveButtonBar } from "./Internal/SaveButtonBar";
import styles from "./Privacy.module.scss";
import accountStyles from "../Account.module.scss";
interface PrivacyProps {}

export const Privacy: React.FC<PrivacyProps> = (props) => {
  const globalStateData = useDataStore(GlobalStateDataStore, ["loggedinuser"]);
  const clanInviteData = useDataStore(ClanInviteDataStore);

  const [showSaveBar, setShowSaveBar] = useState(false);

  useEffect(() => {
    /* What a nice hack... don't use this for nested objects or objects containing arrays */
    const clanPrivacyChanged =
      clanInviteData?.clanInviteSettings &&
      clanInviteData?.initialClanSettings &&
      ObjectUtils.objectToKvpString(clanInviteData?.initialClanSettings) !==
        ObjectUtils.objectToKvpString(clanInviteData?.clanInviteSettings);

    /* Since there are multiple factors impacting whether or not the save settings bar should be showing, it makes sense to track all possible states here */

    if (clanPrivacyChanged) {
      setShowSaveBar(true);
    } else {
      setShowSaveBar(false);
    }
  }, [clanInviteData]);

  const showSettingsChangedToast = () => {
    Toast.show(Localizer.Userresearch.SettingsHaveChanged, {
      position: "br",
    });
  };

  const trySaveSettings = (
    userEditRequest: Contract.UserEditRequest,
    setSubmitting: (isSubmitting: boolean) => void
  ) => {
    if (
      clanInviteData?.clanInviteSettings &&
      clanInviteData?.initialClanSettings
    ) {
      ClanInviteDataStore.updateClans();
    }

    Platform.UserService.UpdateUser(userEditRequest)
      .then((errors) => {
        if (!errors) {
          GlobalStateDataStore.actions
            .refreshCurrentUser(true)
            .async.then((data) => {
              showSettingsChangedToast();
            });
        }
      })
      .catch(ConvertToPlatformError)
      .catch((e) => Modal.error(e))
      .finally(() => {
        setSubmitting(false);
      });

    setShowSaveBar(false);
  };

  const consolidateFlagValues = (
    privacy: BNetAccountPrivacy[]
  ): BNetAccountPrivacy => {
    return privacy.reduce(
      (acc, value) => acc | EnumUtils.getNumberValue(value, BNetAccountPrivacy),
      0
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string,
    formikProps: FormikProps<FormikValues>
  ) => {
    if (e.target.checked) {
      formikProps.setFieldValue(name, true);
    } else {
      formikProps.setFieldValue(name, false);
    }
  };

  return (
    <div>
      <GridCol cols={12}>
        <h3>{Localizer.privacy.privacy}</h3>
      </GridCol>
      <GridDivider cols={12} className={accountStyles.mainDivider} />
      {UserUtils.isAuthenticated(globalStateData) ? (
        <Formik
          initialValues={{
            displayName: null,
            about: null,
            statusText: null,
            membershipId: globalStateData?.loggedInUser?.user?.membershipId,
            locale: null,
            emailAddress: null,
            rejectAllFriendRequestsString: globalStateData?.loggedInUser?.rejectAllFriendRequests?.toString(),
            showActivity: globalStateData?.loggedInUser?.user?.showActivity,
            HideDestinyActivityHistoryFeed: !EnumUtils.hasFlag(
              BNetAccountPrivacy.HideDestinyActivityHistoryFeed,
              globalStateData?.loggedInUser?.privacy
            ),
            HideDestinyProgression: !EnumUtils.hasFlag(
              BNetAccountPrivacy.HideDestinyProgression,
              globalStateData?.loggedInUser?.privacy
            ),
            ShowDestinyInventory: EnumUtils.hasFlag(
              BNetAccountPrivacy.ShowDestinyInventory,
              globalStateData?.loggedInUser?.privacy
            ),
          }}
          enableReinitialize
          onSubmit={(
            {
              HideDestinyActivityHistoryFeed,
              HideDestinyProgression,
              ShowDestinyInventory,
              ...values
            },
            { setSubmitting }
          ) => {
            const checkedOptions = [];
            !HideDestinyActivityHistoryFeed &&
              checkedOptions.push(
                BNetAccountPrivacy.HideDestinyActivityHistoryFeed
              );
            !HideDestinyProgression &&
              checkedOptions.push(BNetAccountPrivacy.HideDestinyProgression);
            ShowDestinyInventory &&
              checkedOptions.push(BNetAccountPrivacy.ShowDestinyInventory);

            trySaveSettings(
              {
                privacyFlags: consolidateFlagValues(checkedOptions),
                rejectAllFriendRequests:
                  values?.rejectAllFriendRequestsString === "true",
                ...values,
              },
              setSubmitting
            );
          }}
        >
          {(formikProps) => {
            return (
              <Form className={styles.form}>
                <div className={styles.section}>
                  <GridCol cols={2} medium={12} className={styles.sectionTitle}>
                    {Localizer.privacy.social}
                  </GridCol>
                  <GridCol cols={10} medium={12}>
                    <div className={styles.row}>
                      <PrivacySelect
                        title={Localizer.Privacy.WhoCanSendYouBungieFriend}
                        name={"rejectAllFriendRequestsString"}
                        options={[
                          { label: Localizer.privacy.anyone, value: "false" },
                          { label: Localizer.privacy.noone, value: "true" },
                        ]}
                        formikProps={formikProps}
                      />
                    </div>
                    <div className={styles.row}>
                      <div
                        className={classNames(styles.checkbox, styles.noBorder)}
                      >
                        <div>
                          <FormikCheckbox
                            name={"showActivity"}
                            checked={formikProps.values.showActivity}
                            onChange={(e) =>
                              handleChange(e, "showActivity", formikProps)
                            }
                            label={Localizer.Privacy.ShowMyForumActivities}
                            classes={{
                              input: styles.input,
                              labelAndCheckbox: styles.label,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </GridCol>
                  <GridDivider cols={12} />
                </div>

                <div className={styles.section}>
                  <GridCol cols={2} medium={12} className={styles.sectionTitle}>
                    {Localizer.privacy.destiny}
                  </GridCol>
                  <GridCol cols={10} medium={12}>
                    <div className={styles.row}>
                      <div className={styles.checkbox}>
                        <div>
                          <FormikCheckbox
                            name={"HideDestinyActivityHistoryFeed"}
                            checked={
                              formikProps.values.HideDestinyActivityHistoryFeed
                            }
                            onChange={(e) =>
                              handleChange(
                                e,
                                "HideDestinyActivityHistoryFeed",
                                formikProps
                              )
                            }
                            label={Localizer.Privacy.ShowMyDestinyGameActivity}
                            classes={{
                              input: styles.input,
                              labelAndCheckbox: styles.label,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.checkbox}>
                        <div>
                          <FormikCheckbox
                            name={"ShowDestinyInventory"}
                            checked={formikProps.values.ShowDestinyInventory}
                            onChange={(e) =>
                              handleChange(
                                e,
                                "ShowDestinyInventory",
                                formikProps
                              )
                            }
                            label={Localizer.Privacy.ShowMyNonEquippedInventory}
                            classes={{
                              input: styles.input,
                              labelAndCheckbox: styles.label,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <ClanInviteCheckboxes
                        user={globalStateData?.loggedInUser}
                      />
                    </div>

                    <div className={styles.row}>
                      <div
                        className={classNames(styles.checkbox, styles.noBorder)}
                      >
                        <div>
                          <FormikCheckbox
                            name={"HideDestinyProgression"}
                            checked={formikProps.values.HideDestinyProgression}
                            onChange={(e) =>
                              handleChange(
                                e,
                                "HideDestinyProgression",
                                formikProps
                              )
                            }
                            label={Localizer.Privacy.ShowMyProgression}
                            classes={{
                              input: styles.input,
                              labelAndCheckbox: styles.label,
                            }}
                          />
                          <div className={styles.subtitle}>
                            {Localizer.Privacy.WhatIVeCompletedInDestiny}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GridCol>
                  <GridDivider cols={12} />
                </div>

                <SaveButtonBar
                  saveButton={
                    <button
                      type="submit"
                      className={styles.textOnly}
                      disabled={
                        !formikProps.isValid || formikProps.isSubmitting
                      }
                    >
                      <Button
                        buttonType={"gold"}
                        loading={formikProps.isSubmitting}
                        disabled={
                          !formikProps.isValid || formikProps.isSubmitting
                        }
                      >
                        {Localizer.userPages.savesettings}
                      </Button>
                    </button>
                  }
                  showing={
                    showSaveBar || (formikProps.dirty && formikProps.isValid)
                  }
                />
              </Form>
            );
          }}
        </Formik>
      ) : null}
    </div>
  );
};
