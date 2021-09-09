// Created by larobinson, 2021
// Copyright Bungie, Inc.

import { ConvertToPlatformError } from "@ApiIntermediary";
import { SmsPage } from "@Areas/Sms/SmsPage";
import styles from "@Areas/User/AccountComponents/EmailSms.module.scss";
import { EmailCheckbox } from "@Areas/User/AccountComponents/Internal/EmailCheckbox";
import { SaveButtonBar } from "@Areas/User/AccountComponents/Internal/SaveButtonBar";
import { useDataStore } from "@bungie/datastore/DataStore";
import { Localizer } from "@bungie/localization";
import { EmailValidationStatus } from "@Enum";
import { GlobalStateDataStore } from "@Global/DataStore/GlobalStateDataStore";
import { Contract, Platform } from "@Platform";
import { RouteHelper } from "@Routes/RouteHelper";
import { GridCol, GridDivider } from "@UI/UIKit/Layout/Grid/Grid";
import { Button } from "@UIKit/Controls/Button/Button";
import { Icon } from "@UIKit/Controls/Icon";
import { Modal } from "@UIKit/Controls/Modal/Modal";
import { Toast } from "@UIKit/Controls/Toast/Toast";
import { FormikTextInput } from "@UIKit/Forms/FormikForms/FormikTextInput";
import { BasicSize } from "@UIKit/UIKitUtils";
import { EnumUtils } from "@Utilities/EnumUtils";
import classNames from "classnames";
import { Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import accountStyles from "../Account.module.scss";

interface EmailAndSmsProps {}

export const EmailAndSms: React.FC<EmailAndSmsProps> = (props) => {
  const globalStateData = useDataStore(GlobalStateDataStore, ["loggedinuser"]);

  const verifyYourEmail = Localizer.Registrationbenefits.VerifyYourEmail;
  const resendEmail = Localizer.Registrationbenefits.ResendEmail;
  const emailVerified =
    (globalStateData.loggedInUser?.emailStatus &
      EmailValidationStatus.VALID) ===
    EmailValidationStatus.VALID;

  const hasFlag = (flag: string, flagValue: number): string => {
    return EnumUtils.hasFlag(
      flagValue,
      globalStateData?.loggedInUser?.emailUsage
    )
      ? flag
      : "none";
  };

  const emailOptInValues: Record<string, number> = {
    socialMarketing: 45, // 1, 4, 8, 32
    playtests: 64, // 64
    playtestsLocal: 128, // 128
    server: 18, // 2, 16
    careers: 256, //256
  };

  const initialOptInValues = Object.keys(emailOptInValues).map((flag) =>
    hasFlag(flag, emailOptInValues[flag])
  );

  const consolidateFlagValues = (emailFlags: string[]) => {
    let addedValue = null;
    let removedValue = null;

    const addedOptIns = emailFlags.filter(
      (a) => !initialOptInValues.includes(a)
    );
    const removedOptIns = initialOptInValues.filter(
      (b) => !emailFlags.includes(b)
    );

    if (addedOptIns.length > 0) {
      addedValue = addedOptIns
        .reduce((acc, value) => acc | emailOptInValues[value], 0)
        .toString();
    }
    if (removedOptIns.length > 0) {
      removedValue = removedOptIns
        .reduce((acc, value) => acc | emailOptInValues[value], 0)
        .toString();
    }

    return [addedValue, removedValue];
  };

  const showSettingsChangedToast = () => {
    Toast.show(Localizer.Userresearch.SettingsHaveChanged, {
      position: "br",
    });
  };

  const trySaveSettings = (userEditRequest: Contract.UserEditRequest) => {
    Platform.UserService.UpdateUser(userEditRequest)
      .then(() => {
        GlobalStateDataStore.actions
          .refreshCurrentUser(true)
          .promise.then((data) => data && showSettingsChangedToast());
      })
      .catch(ConvertToPlatformError)
      .catch((e) => Modal.error(e));
  };

  return (
    <div>
      <GridCol cols={12}>
        <h3>{Localizer.account.emailSms}</h3>
      </GridCol>
      <GridDivider cols={12} className={accountStyles.mainDivider} />

      <Formik
        initialValues={{
          displayName: globalStateData?.loggedInUser?.user?.displayName,
          about: globalStateData?.loggedInUser?.user?.about,
          statusText: globalStateData?.loggedInUser?.user?.statusText,
          membershipId: globalStateData?.loggedInUser?.user?.membershipId,
          locale: globalStateData?.loggedInUser?.user?.locale,
          emailAddress: globalStateData?.loggedInUser?.email,
          emailFlags: initialOptInValues,
        }}
        validationSchema={Yup.object({
          email: Yup.string(),
        })}
        onSubmit={({ emailFlags, ...values }, { setSubmitting }) => {
          const [addedOptIns, removedOptIns] = consolidateFlagValues(
            emailFlags
          );
          setTimeout(() => {
            trySaveSettings({ ...values, addedOptIns, removedOptIns });
            setSubmitting(false);
          }, 400);
        }}
      >
        {(formikProps) => (
          <>
            <Form className={styles.form}>
              <GridCol cols={12}>
                <div className={styles.emailSection}>
                  <GridCol className={styles.sectionLabel} cols={2} medium={12}>
                    {Localizer.Userpages.CreateViewEmailLabel}
                  </GridCol>
                  <GridCol cols={10} medium={12}>
                    <div className={styles.relContainer}>
                      <FormikTextInput
                        name={"emailAddress"}
                        type={"email"}
                        placeholder={formikProps.values.emailAddress}
                        classes={{ input: styles.textInput }}
                      />
                      <Icon iconName={"pencil"} iconType={"fa"} />
                    </div>
                    <button
                      type="submit"
                      className={styles.textOnly}
                      disabled={!(formikProps.isValid && formikProps.dirty)}
                    >
                      <Button
                        buttonType={"gold"}
                        size={BasicSize.Small}
                        disabled={!(formikProps.isValid && formikProps.dirty)}
                      >
                        {Localizer.userPages.savesettings}
                      </Button>
                    </button>
                  </GridCol>
                </div>
                <GridCol cols={2} medium={0} />
                <GridCol cols={10} medium={12}>
                  {emailVerified ? (
                    <div className={styles.emailSettings}>
                      <hr />
                      <div className={styles.checkboxContainer}>
                        {Object.keys(emailOptInValues).map((flag: string) => {
                          return (
                            <EmailCheckbox
                              key={flag}
                              value={flag}
                              secondary={flag === "playtestsLocal"}
                              formikProps={formikProps}
                              label={Localizer.Registrationbenefits[flag]}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.containerVerifyEmail}>
                      <div className={styles.verifyEmail}>
                        <div className={styles.text}>
                          <strong>{verifyYourEmail}</strong>
                          <p>{Localizer.messages.UserEmailVerificationSent}</p>
                        </div>
                      </div>
                      <div className={styles.buttons}>
                        <Button
                          buttonType={"gold"}
                          size={BasicSize.Small}
                          url={RouteHelper.ResendEmailVerification(
                            globalStateData.loggedInUser.user.membershipId
                          )}
                        >
                          {resendEmail}
                        </Button>
                      </div>
                    </div>
                  )}
                </GridCol>
              </GridCol>
              <SaveButtonBar
                className={classNames(styles.emailBar, {
                  [styles.show]: formikProps.dirty && formikProps.isValid,
                })}
                saveButton={
                  <button
                    type="submit"
                    className={classNames(styles.textOnly, styles.saveButton)}
                  >
                    <Button
                      buttonType={"gold"}
                      loading={formikProps.isSubmitting}
                      disabled={
                        !formikProps.dirty ||
                        !formikProps.isValid ||
                        formikProps.isSubmitting
                      }
                    >
                      {Localizer.userPages.savesettings}
                    </Button>
                  </button>
                }
                on={formikProps.dirty && formikProps.isValid}
              />
            </Form>

            <GridCol className={styles.smsContainer} cols={12}>
              <h3 className={styles.smsHeader}>
                {Localizer.sms.VerifyYourSms}
              </h3>
            </GridCol>
            <GridDivider cols={12} className={accountStyles.mainDivider} />
            <GridCol cols={12}>
              <div className={styles.smsSection}>
                <h4 className={styles.subtitle}>{Localizer.sms.subtitle}</h4>
                <SmsPage accountView={true} />
              </div>
            </GridCol>
          </>
        )}
      </Formik>
    </div>
  );
};