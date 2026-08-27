"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import "./admin-password-modal.scss";

/**
 * Transcribed from admin-password-modal.component.html.
 *
 * The admin gates every create behind a re-entry of the operator's own
 * password: the form emits its payload, this modal opens, and only a verified
 * password lets the create actually run.
 *
 * Rendered through a portal to `document.body` because that is where the
 * Angular one lives — `<app-admin-password-modal>` sits at the root of
 * admin.component.html, a sibling of the form rather than inside it. That
 * placement matters: `.modal-content` uses `backdrop-filter: blur(12px)`, which
 * samples whatever is painted behind it, so nesting the modal inside the form's
 * own blurred, scoped shell gave it a different backdrop than the admin's.
 */
export interface AdminPasswordModalProps {
  show: boolean;
  value: string;
  error: string | null;
  isVerifying: boolean;
  showPassword: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminPasswordModal({
  show,
  value,
  error,
  isVerifying,
  showPassword,
  onChange,
  onToggleVisibility,
  onClose,
  onConfirm,
}: AdminPasswordModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open so the password can be typed straight away, and let Escape
  // dismiss — neither is in the Angular original, but a modal that traps the
  // keyboard without them is worse than one that does not.
  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !isVerifying) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, isVerifying, onClose]);

  // The portal needs a DOM target. No mount flag is required: `show` only ever
  // becomes true from a user action, which is necessarily after hydration.
  if (!show || typeof document === "undefined") return null;

  const canConfirm = !isVerifying && value.trim().length > 0;

  /** `onKeyPress` in the Angular component — Enter confirms. */
  const onKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && canConfirm) {
      event.preventDefault();
      onConfirm();
    }
  };

  return createPortal(
    <div className="admin-password-modal-scope">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="amp-title">
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!isVerifying) onClose();
          }}
        />
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="amp-title">Authentication Required</h2>
            <span
              className={"material-icons close-icon" + (isVerifying ? " disabled" : "")}
              onClick={() => {
                if (!isVerifying) onClose();
              }}
            >
              close
            </span>
          </div>

          <div className="modal-body">
            <p>Please enter your admin password to confirm this action.</p>
            <div className="form-group">
              <div className="input-container password-container">
                <span className="material-icons input-icon">admin_panel_settings</span>
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  id="adminPasswordModal"
                  className="form-control"
                  placeholder="Enter admin password"
                  value={value}
                  disabled={isVerifying}
                  autoComplete="current-password"
                  onChange={(event) => onChange(event.target.value)}
                  onKeyDown={onKeyPress}
                />
                <span
                  className={
                    "material-icons visibility-toggle" + (isVerifying ? " disabled" : "")
                  }
                  onClick={() => {
                    if (!isVerifying) onToggleVisibility();
                  }}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              <span className="material-icons">
                {isVerifying ? "hourglass_empty" : "check_circle"}
              </span>
              {isVerifying ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
