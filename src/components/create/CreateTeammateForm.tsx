"use client";

import { useMemo, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/auth";
import type { CrmCapability } from "@/lib/auth";
import { CRM_CAPABILITY_INFO, crmTeammateApi } from "@/lib/crm-teammates";
import {
  isSpaceKey,
  normalizeUsernameForStorage,
  trimUsernameEdges,
  validateUsername,
} from "@/lib/username";
import { AdminPasswordModal } from "./AdminPasswordModal";
import { useUsernameField } from "./use-username-field";
import "./user-form.scss";

/**
 * Create a CRM teammate and grant their access.
 *
 * The access picker is the point of this form. A teammate holds any combination
 * of the CRM's pages, so each is a card that says what it lets them do, rather
 * than a bare checkbox list — the person filling this in is deciding what
 * someone can do with real money, and "Deposits" alone does not say whether
 * that means seeing them or approving them.
 *
 * Granting nothing is refused here and again on the server: an account that can
 * sign in and reach no page reads as broken, and it is nearly always a
 * forgotten checkbox.
 */

interface Values {
  fullName: string;
  mobileNumber: string;
  password: string;
  profileName: string;
}

const EMPTY: Values = { fullName: "", mobileNumber: "", password: "", profileName: "" };

const NO_ACCESS: Record<CrmCapability, boolean> = {
  clients: false,
  create: false,
  deposit: false,
  withdrawal: false,
  transaction: false,
};

export function CreateTeammateForm({
  /** Called after a teammate is created, so a surrounding list can reload. */
  onCreated,
}: {
  onCreated?: () => void;
} = {}) {
  // `_tm`, as diwine_admin's create-teammate form does, so a teammate is
  // recognisable by name in a user list shared with players.
  const usernameField = useUsernameField("_tm");

  const [values, setValues] = useState<Values>(EMPTY);
  const [access, setAccess] = useState<Record<CrmCapability, boolean>>(NO_ACCESS);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const grantedCount = useMemo(
    () => CRM_CAPABILITY_INFO.filter((item) => access[item.key]).length,
    [access],
  );

  const errors = useMemo(() => {
    const found: Partial<Record<keyof Values | "username" | "access", string>> = {};
    if (!values.fullName.trim()) found.fullName = "This field is required";
    else if (values.fullName.trim().length < 3)
      found.fullName = "Minimum length is 3 characters";

    const usernameError = validateUsername(usernameField.username);
    if (usernameError) found.username = usernameError;

    if (!values.password) found.password = "This field is required";
    else if (values.password.length < 6) found.password = "Minimum length is 6 characters";

    if (values.mobileNumber && !/^[0-9]{10,15}$/.test(values.mobileNumber))
      found.mobileNumber = "Mobile number must be 10-15 digits";

    if (grantedCount === 0) found.access = "Grant at least one access";
    return found;
  }, [values, usernameField.username, grantedCount]);

  const errorFor = (key: keyof typeof errors) =>
    submitted && errors[key] ? (errors[key] as string) : "";

  const hasErrors =
    Object.keys(errors).length > 0 || usernameField.usernameAvailable === false;

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const reset = () => {
    usernameField.reset();
    setValues(EMPTY);
    setAccess(NO_ACCESS);
    setSubmitted(false);
    setCreateError("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setAdminPassword("");
    setAdminPasswordError(null);
    setShowPasswordModal(true);
  };

  const confirm = async () => {
    if (!adminPassword.trim()) {
      setAdminPasswordError("Please enter your password");
      return;
    }
    setAdminPasswordError(null);
    setIsVerifying(true);
    try {
      const verified = await authApi.verifyPassword(adminPassword);
      if (!verified?.success) {
        setAdminPasswordError("Incorrect password. Please try again.");
        return;
      }
      setShowPasswordModal(false);
      setAdminPassword("");

      const result = await crmTeammateApi.create({
        username: normalizeUsernameForStorage(usernameField.username),
        fullName: values.fullName,
        password: values.password,
        mobileNumber: values.mobileNumber || null,
        profileName: values.profileName || null,
        permissions: access,
      });

      setCreateError("");
      setSuccessMessage(
        `Teammate "${result.data?.username ?? usernameField.username}" created — ${
          result.data?.accessSummary ?? "access granted"
        }.`,
      );
      reset();
      onCreated?.();
    } catch (error) {
      setSuccessMessage("");
      setCreateError(
        error instanceof ApiError && error.message ? error.message : "Failed to create teammate",
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
            <span className="material-icons close-icon" onClick={() => setSuccessMessage("")}>
              close
            </span>
          </div>
        )}

        <form className="dl-form" onSubmit={onSubmit} noValidate>
          <div className="form-section">
            <div className="form-header">
              <h2 className="font-akshar font-medium text-[16px] leading-[100%] text-[#214055]">
                CRM TeamMate
              </h2>
              <div className="form-actions-top dashboard-actions">
                <button type="button" className="reset-button" onClick={reset}>
                  <span className="material-icons">refresh</span>
                  Reset
                </button>
              </div>
            </div>

            <div className="info-box">
              <span className="material-icons">info</span>
              <p>
                A teammate signs in to this CRM and sees only what you grant below. They are
                staff, never players — nothing here creates a wallet or touches a hierarchy.
              </p>
            </div>

            {createError && <div className="error-message root-user-error">{createError}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tm-fullName">
                  Full Name <span className="required text-red-500">*</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">person</span>
                  <input
                    type="text"
                    id="tm-fullName"
                    className="form-control"
                    placeholder="Enter full name"
                    value={values.fullName}
                    onChange={(event) => {
                      set("fullName", event.target.value);
                      usernameField.onFullNameChange(event.target.value);
                    }}
                  />
                </div>
                {errorFor("fullName") && (
                  <div className="error-message">{errorFor("fullName")}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tm-username">
                  Username <span className="required text-red-500">*</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">account_circle</span>
                  <input
                    type="text"
                    id="tm-username"
                    className="form-control"
                    placeholder="Enter username"
                    value={usernameField.username}
                    onChange={(event) =>
                      usernameField.setUsername(trimUsernameEdges(event.target.value))
                    }
                    onKeyDown={(event) => {
                      if (isSpaceKey(event.key, event.code)) event.preventDefault();
                    }}
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
                  {usernameField.isCheckingUsername && <span className="loading-spinner" />}
                </div>

                {usernameField.username.length >= 4 && (
                  <div className="username-status">
                    {usernameField.usernameAvailable === true && (
                      <div className="username-available">
                        <span className="material-icons success-icon">check_circle</span>
                        Username is available!
                      </div>
                    )}
                    {usernameField.usernameAvailable === false && (
                      <div className="username-not-available">
                        <span className="material-icons error-icon">error</span> Username is
                        already taken
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
                <label htmlFor="tm-password">
                  Password <span className="required text-red-500">*</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">lock</span>
                  <input
                    type="text"
                    id="tm-password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(event) => set("password", event.target.value)}
                  />
                </div>
                <div className="helper-text">
                  <span className="material-icons">info</span>
                  Shown in plain text so you can pass it on — they sign in with this.
                </div>
                {errorFor("password") && (
                  <div className="error-message">{errorFor("password")}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tm-mobile">
                  Mobile Number <span className="optional-label">(Optional)</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">phone</span>
                  <input
                    type="tel"
                    id="tm-mobile"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={values.mobileNumber}
                    onChange={(event) => set("mobileNumber", event.target.value)}
                  />
                </div>
                {errorFor("mobileNumber") && (
                  <div className="error-message">{errorFor("mobileNumber")}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tm-profile">
                  Role Name <span className="optional-label">(Optional)</span>
                </label>
                <div className="input-container">
                  <span className="material-icons input-icon">badge</span>
                  <input
                    type="text"
                    id="tm-profile"
                    className="form-control"
                    placeholder="e.g. Deposit Banker"
                    value={values.profileName}
                    onChange={(event) => set("profileName", event.target.value)}
                  />
                </div>
                <div className="helper-text">
                  <span className="material-icons">info</span>
                  A label for this combination, shown in the teammate list
                </div>
              </div>
            </div>
          </div>

          {/* ── access ──────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-header">
              <h2 className="font-akshar font-medium text-[16px] leading-[100%] text-[#214055]">
                CRM Access <span className="required text-red-500">*</span>
              </h2>
              <span className="text-[12.5px] text-[#6a95b9]">
                {grantedCount === 0
                  ? "Nothing granted yet"
                  : `${grantedCount} of ${CRM_CAPABILITY_INFO.length} granted`}
              </span>
            </div>

            <div className="tm-access-grid">
              {CRM_CAPABILITY_INFO.map((item) => {
                const on = access[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() =>
                      setAccess((current) => ({ ...current, [item.key]: !current[item.key] }))
                    }
                    className={"tm-access-card" + (on ? " is-on" : "")}
                  >
                    <span className="material-icons tm-access-icon">{item.icon}</span>
                    <span className="tm-access-copy">
                      <span className="tm-access-label">{item.label}</span>
                      <span className="tm-access-desc">{item.description}</span>
                    </span>
                    <span className="material-icons tm-access-tick">
                      {on ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>

            {errorFor("access") && <div className="error-message">{errorFor("access")}</div>}
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={reset}>
              Reset
            </button>
            <button type="submit" className="secondary-button">
              <span className="material-icons">add_circle</span>
              Create TeamMate
            </button>
          </div>
        </form>
      </div>

      <AdminPasswordModal
        show={showPasswordModal}
        value={adminPassword}
        error={adminPasswordError}
        isVerifying={isVerifying}
        showPassword={showAdminPassword}
        onChange={(value) => {
          setAdminPassword(value);
          if (adminPasswordError) setAdminPasswordError(null);
        }}
        onToggleVisibility={() => setShowAdminPassword((current) => !current)}
        onClose={() => {
          setShowPasswordModal(false);
          setAdminPassword("");
          setAdminPasswordError(null);
        }}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
