"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/auth";
import { endUserApi } from "@/lib/end-users";
import { getAllPlatforms, type Platform } from "@/lib/platforms";
import {
  isSpaceKey,
  normalizeUsernameForStorage,
  trimUsernameEdges,
  validateUsername,
} from "@/lib/username";
import { AdminPasswordModal } from "./AdminPasswordModal";
import { PLAYER_CATEGORIES } from "./create-nav.config";
import { useUsernameField } from "./use-username-field";
import "./user-form.scss";

/**
 * Dummy platform user creation — the only kind the CRM creates.
 *
 * Normal players are created in diwine_admin: that path walks the hierarchy,
 * resolves sharing ratios from the upline and mirrors into sikenderX. A root
 * user has no upline at all, so creating one is three writes in a single
 * transaction and nothing else is touched.
 *
 * The account-type toggle is gone with the normal branch — there is only one
 * kind of user to make here now.
 */

interface FormValues {
  fullName: string;
  username: string;
  mobileNumber: string;
  category: string;
  platformId: string;
}

const INITIAL_VALUES: FormValues = {
  fullName: "",
  username: "",
  mobileNumber: "",
  category: "D1",
  platformId: "",
};

type Touched = Partial<Record<keyof FormValues, boolean>>;

function validate(values: FormValues): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!values.fullName.trim()) errors.fullName = "This field is required";
  else if (values.fullName.trim().length < 3)
    errors.fullName = "Minimum length is 3 characters";

  const usernameError = validateUsername(values.username);
  if (usernameError) errors.username = usernameError;

  if (values.mobileNumber && !/^[0-9]{10,15}$/.test(values.mobileNumber))
    errors.mobileNumber = "Mobile number must be 10-15 digits";

  return errors;
}

export function CreateUserForm() {
  const usernameField = useUsernameField();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Touched>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllPlatforms(true)
      .then((rows) => {
        if (!cancelled) setPlatforms(rows);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingPlatforms(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formValues = useMemo(
    () => ({ ...values, username: usernameField.username }),
    [values, usernameField.username],
  );

  const errors = useMemo(() => validate(formValues), [formValues]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const blur = (key: keyof FormValues) =>
    setTouched((current) => ({ ...current, [key]: true }));

  const errorFor = (key: keyof FormValues): string =>
    (touched[key] || formSubmitted) && errors[key] ? (errors[key] as string) : "";

  const hasErrors =
    Object.values(errors).some(Boolean) || usernameField.usernameAvailable === false;

  const resetForm = () => {
    usernameField.reset();
    setValues(INITIAL_VALUES);
    setTouched({});
    setFormSubmitted(false);
    setCreateError("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormSubmitted(true);
    if (hasErrors) return;

    setAdminPasswordInput("");
    setAdminPasswordError(null);
    setShowAdminPasswordModal(true);
  };

  const confirmAdminPassword = async () => {
    if (!adminPasswordInput.trim()) {
      setAdminPasswordError("Please enter your password");
      return;
    }

    setAdminPasswordError(null);
    setIsVerifying(true);

    try {
      const verified = await authApi.verifyPassword(adminPasswordInput);
      if (!verified?.success) {
        setAdminPasswordError("Incorrect password. Please try again.");
        return;
      }

      setShowAdminPasswordModal(false);
      setAdminPasswordInput("");

      const result = await endUserApi.createDummyUser({
        username: normalizeUsernameForStorage(formValues.username),
        fullName: formValues.fullName,
        mobileNumber: formValues.mobileNumber || null,
        category: formValues.category,
        platformId: formValues.platformId || undefined,
      });

      setCreateError("");
      setSuccessMessage(
        `Dummy platform user "${result.data?.username ?? formValues.username}" created.`,
      );
      resetForm();
    } catch (error) {
      setSuccessMessage("");
      setCreateError(
        error instanceof ApiError && error.message
          ? error.message
          : "Failed to create user",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="user-form-scope">
      <div className="dl-form-container">
        {successMessage && (
          <div className="success-message">
            <span className="material-icons success-icon">check_circle</span>
            <span>{successMessage}</span>
            <span
              className="material-icons close-icon"
              onClick={() => setSuccessMessage("")}
            >
              close
            </span>
          </div>
        )}

        <form className="dl-form" onSubmit={onSubmit} noValidate>
          <div className="form-section">
            <div className="form-header">
              <h2 className="font-akshar font-medium text-[16px] leading-[100%] text-[#214055]">
                Dummy Platform User
              </h2>
              <div className="form-actions-top dashboard-actions">
                <button type="button" className="reset-button" onClick={resetForm}>
                  <span className="material-icons">refresh</span>
                  Reset
                </button>
              </div>
            </div>

            <div className="info-box">
              <span className="material-icons">info</span>
              <p>
                No DL, Super or Master above them — deposits and withdrawals for this
                user never move anyone else&rsquo;s chips. They never sign in, so a
                random password is generated automatically.
              </p>
            </div>

            {createError && (
              <div className="error-message root-user-error">{createError}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name <span className="required text-red-500">*</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">person</span>
                  <input
                    type="text"
                    id="fullName"
                    className="form-control"
                    placeholder="Enter full name"
                    value={values.fullName}
                    onChange={(event) => {
                      set("fullName", event.target.value);
                      usernameField.onFullNameChange(event.target.value);
                    }}
                    onBlur={() => blur("fullName")}
                  />
                </div>
                {errorFor("fullName") && (
                  <div className="error-message">{errorFor("fullName")}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="required text-red-500">*</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">account_circle</span>
                  <input
                    type="text"
                    id="username"
                    className="form-control"
                    placeholder="Enter username"
                    value={usernameField.username}
                    onChange={(event) =>
                      usernameField.setUsername(trimUsernameEdges(event.target.value))
                    }
                    onKeyDown={(event) => {
                      if (isSpaceKey(event.key, event.code)) event.preventDefault();
                    }}
                    onBlur={() => blur("username")}
                  />
                  {values.fullName.trim().length >= 3 && (
                    <button
                      type="button"
                      className="username-generate-btn"
                      title="Generate from name"
                      onClick={() => usernameField.generateFromFullName(values.fullName)}
                    >
                      <span className="material-icons">sync</span>
                    </button>
                  )}
                  {usernameField.isCheckingUsername && (
                    <span className="loading-spinner" />
                  )}
                </div>

                {usernameField.username.length >= 4 && (
                  <div className="username-status">
                    {usernameField.isCheckingUsername && (
                      <div className="username-checking">
                        <span className="material-icons spin">sync</span> Checking
                        availability...
                      </div>
                    )}
                    {usernameField.usernameAvailable === true && (
                      <div className="username-available">
                        <span className="material-icons success-icon">check_circle</span>
                        Username is available!
                      </div>
                    )}
                    {usernameField.usernameAvailable === false && (
                      <div className="username-not-available">
                        <span className="material-icons error-icon">error</span> Username
                        is already taken
                        {usernameField.usernameSuggestions.length > 0 && (
                          <div className="username-suggestions">
                            <p>Try one of these instead:</p>
                            <div className="suggestion-chips">
                              {usernameField.usernameSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  className="suggestion-chip"
                                  onClick={() =>
                                    usernameField.applySuggestion(suggestion)
                                  }
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {errorFor("username") && (
                  <div className="error-message">{errorFor("username")}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobileNumber">
                  Mobile Number <span className="optional-label">(Optional)</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">phone</span>
                  <input
                    type="tel"
                    id="mobileNumber"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={values.mobileNumber}
                    onChange={(event) => set("mobileNumber", event.target.value)}
                    onBlur={() => blur("mobileNumber")}
                  />
                </div>
                {errorFor("mobileNumber") && (
                  <div className="error-message">{errorFor("mobileNumber")}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <div className="input-container">
                  <span className="material-icons input-icon">label</span>
                  <select
                    id="category"
                    className="form-control"
                    value={values.category}
                    onChange={(event) => set("category", event.target.value)}
                  >
                    {PLAYER_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="platformId">Platform</label>
                <div className="input-container">
                  <span className="material-icons input-icon">dns</span>
                  <select
                    id="platformId"
                    className="form-control"
                    value={values.platformId}
                    onChange={(event) => set("platformId", event.target.value)}
                  >
                    <option value="">
                      {loadingPlatforms ? "Loading platforms..." : "Select Platform"}
                    </option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="helper-text">
                  <span className="material-icons">info</span>
                  Deposits and withdrawals are raised against this platform
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              Reset
            </button>
            <button type="submit" className="secondary-button">
              <span className="material-icons">add_circle</span>
              Create Dummy Platform User
            </button>
          </div>
        </form>
      </div>

      <AdminPasswordModal
        show={showAdminPasswordModal}
        value={adminPasswordInput}
        error={adminPasswordError}
        isVerifying={isVerifying}
        showPassword={showAdminPassword}
        onChange={(value) => {
          setAdminPasswordInput(value);
          if (adminPasswordError) setAdminPasswordError(null);
        }}
        onToggleVisibility={() => setShowAdminPassword((current) => !current)}
        onClose={() => {
          setShowAdminPasswordModal(false);
          setAdminPasswordInput("");
          setAdminPasswordError(null);
        }}
        onConfirm={() => void confirmAdminPassword()}
      />
    </div>
  );
}
