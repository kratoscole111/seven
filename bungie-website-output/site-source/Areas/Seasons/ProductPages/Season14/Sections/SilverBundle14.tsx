// Created by a-bphillips, 2021
// Copyright Bungie, Inc.

import { SectionHeader } from "@Areas/Seasons/ProductPages/Season14/Components/SectionHeader";
import { Responsive } from "@Boot/Responsive";
import { Localizer } from "@Global/Localization/Localizer";
import { Platform } from "@Platform";
import { RouteHelper } from "@Routes/RouteHelper";
import { BuyButton } from "@UIKit/Controls/Button/BuyButton";
import { ConfigUtils } from "@Utilities/ConfigUtils";
import { LocalizerUtils } from "@Utilities/LocalizerUtils";
import classNames from "classnames";
import moment from "moment";
import React, { LegacyRef, useEffect, useState } from "react";
import styles from "./SilverBundle14.module.scss";

interface ISilverBundleSC {
  SectionHeading?: string;
  SectionBlurb?: string;
  SectionDisclaimer?: string;
  SectionBtnText?: string;
}

const fetchText = async () => {
  try {
    const sc = await Platform.ContentService.GetContentByTagAndType(
      "season-14-silver-bundles",
      "StringCollection",
      Localizer.CurrentCultureName,
      false
    );

    const data: ISilverBundleSC = LocalizerUtils.stringCollectionToObject(sc);

    return data;
  } catch (err) {
    return null;
  }
};

const fetchBgImages = async () => {
  try {
    const images = await Platform.ContentService.GetContentByTagAndType(
      "season-14-silver-section-bg",
      "MarketingMediaAsset",
      Localizer.CurrentCultureName,
      false
    );

    return images.properties;
  } catch (err) {
    return null;
  }
};

interface SilverBundle14Props {
  inputRef: LegacyRef<HTMLDivElement>;
}

export const SilverBundle14: React.FC<SilverBundle14Props> = (props) => {
  const s14 = Localizer.Season14;
  // section strings
  const [bundle, setBundle] = useState<null | ISilverBundleSC>(null);
  const [bgImages, setBgImages] = useState(null);

  useEffect(() => {
    // get section text
    fetchText().then((response) => {
      setBundle(response);
    });
    // get desktop and mobile bg images
    fetchBgImages().then((response) => {
      setBgImages({
        desktopBg: response?.LargeImage,
        mobileBg: response?.ImageThumbnail,
      });
    });
  }, []);

  // date silver bundle should be shown on the page
  const silverBundleDate = ConfigUtils.GetParameter(
    "Season14PageUpdate",
    "ShowSilverBundles",
    ""
  );
  // parsed date using moment
  const parsedBundleDate = moment(silverBundleDate);
  const now = moment();
  // boolean to control whether or not to show silver bundle
  const isSilverBundleLive = now.isAfter(parsedBundleDate);

  // get bg image for section based on screen size
  const bgImage = Responsive.state.mobile
    ? bgImages?.mobileBg
    : bgImages?.desktopBg;

  return (
    <>
      {bundle && isSilverBundleLive && (
        <div
          className={styles.silverBundle}
          id={"silver"}
          ref={props.inputRef}
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className={styles.contentWrapperNormal}>
            <div
              className={classNames(
                styles.textContent,
                styles.indentHeadingBox
              )}
            >
              <SectionHeader
                title={bundle?.SectionHeading}
                seasonText={s14.SectionHeaderSeasonText}
                sectionName={s14.SilverBundleSectionName}
                isBold={true}
              />
              <p
                className={classNames(styles.paragraph, styles.blurb)}
                dangerouslySetInnerHTML={{ __html: bundle?.SectionBlurb }}
              />
              <BuyButton
                data-analytics-id={""}
                buttonType={"teal"}
                url={RouteHelper.DestinyBuyDetail({
                  productFamilyTag: "silverbundle",
                })}
                className={styles.buyNowBtn}
              >
                {bundle?.SectionBtnText}
              </BuyButton>
              <p className={styles.disclaimer}>{bundle?.SectionDisclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
