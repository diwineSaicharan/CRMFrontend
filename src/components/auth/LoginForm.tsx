"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "./AuthProvider";
import { resolveLoginError } from "@/lib/auth";
import styles from "./LoginForm.module.css";

/** Field chrome from login.component.html, unchanged. */
const FIELD =
  "relative flex h-[42px] w-full items-center overflow-hidden rounded-md border " +
  "bg-white transition-colors focus-within:border-[#7BB8D6]";

const INPUT =
  "h-full w-full border-none bg-transparent pl-[42px] pr-3 text-sm text-[#295B83] " +
  "outline-none placeholder:text-[#6A95B9]";

const ICON = "pointer-events-none absolute left-3.5 text-[#295B83]";

export function LoginForm() {
  const router = useRouter();
  const { login, status } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Someone who is already signed in has no business on this screen.
  useEffect(() => {
    if (status === "authenticated") router.replace("/clients");
  }, [status, router]);

  const showError = (message: string) => {
    setErrorMessage(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
      setShake(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed) return showError("Please enter your username");
    if (!password) return showError("Please enter your password");

    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(trimmed, password);
      router.replace("/clients");
    } catch (error) {
      setIsLoading(false);
      showError(resolveLoginError(error));
    }
  };

  return (
    <div
      className={
        styles.page + " fixed inset-0 flex min-h-screen items-center justify-center"
      }
    >
      <div className="content-body group/content relative isolate m-auto h-auto w-full max-w-md flex-none overflow-hidden rounded-xl border-[7px] border-transparent bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] dark:bg-[#0091ff0d] dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]">
        <div className="p-7">
          <h1 className="mb-1 text-lg font-medium text-headings">
            Welcome to StakeBazzaar CRM
          </h1>
          <p className="mb-5 text-sm text-[#333333]/75">
            Please enter your credentials to continue.
          </p>

          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div
              className={
                FIELD +
                " " +
                (errorMessage ? "border-red-400" : "border-[#C0DFED]") +
                (shake ? " " + styles.shake : "")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={ICON}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
              </svg>
              <input
                type="text"
                className={styles.loginInput + " " + INPUT}
                placeholder="Username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  clearError();
                }}
                autoComplete="username"
                aria-invalid={errorMessage ? true : undefined}
                aria-label="Username"
              />
            </div>

            <div
              className={
                FIELD +
                " " +
                (errorMessage ? "border-red-400" : "border-[#C0DFED]") +
                (shake ? " " + styles.shake : "")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={ICON}
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                className={styles.loginInput + " " + INPUT}
                placeholder="Password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError();
                }}
                autoComplete="current-password"
                aria-invalid={errorMessage ? true : undefined}
                aria-label="Password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#3e7189] px-4 text-sm font-medium text-white transition-colors hover:bg-[#356278] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={styles.spinner + " h-3.5 w-3.5 rounded-full"}
                  />
                  Signing In...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-1.5 rounded-[5px] border border-red-200 border-l-4 border-l-red-600 bg-red-500/10 px-3 py-2 text-xs leading-snug font-medium text-red-600 shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
              >
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] leading-none font-bold">
                  !
                </span>
                <span className="truncate">{errorMessage}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
