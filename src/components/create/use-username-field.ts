"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  checkUsernameAvailability,
  generateRandomUsername,
  USERNAME_MIN_LENGTH,
  normalizeUsernameForStorage,
} from "@/lib/username";

/**
 * The username behaviour from create-dl-form.component.ts, as a hook.
 *
 * Two Angular `valueChanges` pipelines are reproduced here:
 *
 *  - fullName, debounced 300ms: auto-generates a username, but only while the
 *    user has not typed one themselves (`!usernameControl.dirty`). Typing in
 *    the field marks it dirty and the suggestions stop overwriting it.
 *  - username, debounced 500ms + distinctUntilChanged: checks availability once
 *    the value reaches 4 characters, and defaults to "available" on a failed
 *    request rather than blocking the form.
 */
const FULLNAME_DEBOUNCE_MS = 300;
const USERNAME_DEBOUNCE_MS = 500;

export interface UsernameFieldState {
  username: string;
  isCheckingUsername: boolean;
  /** null = not checked yet or too short to check. */
  usernameAvailable: boolean | null;
  usernameSuggestions: string[];
  /** True once the user edits the field by hand — stops auto-generation. */
  usernameDirty: boolean;
  setUsername: (value: string) => void;
  onFullNameChange: (fullName: string) => void;
  generateFromFullName: (fullName: string) => void;
  applySuggestion: (suggestion: string) => void;
  reset: () => void;
}

export function useUsernameField(
  /**
   * Applied to every generated username, never to a hand-typed one.
   *
   * diwine_admin's create-teammate form appends `_tm`, so a teammate is
   * recognisable by its name in a user list shared with players. Passing the
   * suffix in keeps that convention with the form that needs it, rather than
   * teaching the generator about roles.
   */
  suffix = "",
): UsernameFieldState {
  const [username, setUsernameState] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameDirty, setUsernameDirty] = useState(false);

  const fullNameTimer = useRef<number | null>(null);
  const usernameTimer = useRef<number | null>(null);
  // `distinctUntilChanged` — never re-check the same value twice.
  const lastChecked = useRef<string | null>(null);
  const dirtyRef = useRef(false);

  const setUsername = useCallback((value: string) => {
    setUsernameState(value);
    setUsernameDirty(true);
    dirtyRef.current = true;
  }, []);

  /** Programmatic set — does not count as the user editing the field. */
  const setGenerated = useCallback((value: string) => {
    setUsernameState(value);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
  }, []);

  /** Suffixed, and re-trimmed so the result still satisfies the field's rules. */
  const withSuffix = useCallback(
    (value: string) => (suffix ? normalizeUsernameForStorage(value + suffix) : value),
    [suffix],
  );

  const generateFromFullName = useCallback(
    (fullName: string) => {
      const generated = generateRandomUsername(fullName);
      if (generated) setGenerated(withSuffix(generated));
    },
    [setGenerated, withSuffix],
  );

  /**
   * Debounced auto-generation. Skipped once the field is dirty, so a
   * hand-typed username is never overwritten by later name edits.
   */
  const onFullNameChange = useCallback(
    (fullName: string) => {
      if (fullNameTimer.current) window.clearTimeout(fullNameTimer.current);

      fullNameTimer.current = window.setTimeout(() => {
        if (fullName.length >= 3 && !dirtyRef.current) {
          const generated = generateRandomUsername(fullName);
          if (generated) setGenerated(withSuffix(generated));
        }
      }, FULLNAME_DEBOUNCE_MS);
    },
    [setGenerated, withSuffix],
  );

  // Debounced availability check on the username itself. A value below the
  // minimum length is simply never checked; the "too short" presentation is
  // derived below rather than written back into state.
  useEffect(() => {
    if (usernameTimer.current) window.clearTimeout(usernameTimer.current);

    if (username.length < USERNAME_MIN_LENGTH) {
      lastChecked.current = null;
      return;
    }

    if (username === lastChecked.current) return;

    let cancelled = false;
    usernameTimer.current = window.setTimeout(() => {
      lastChecked.current = username;
      setIsCheckingUsername(true);
      setUsernameAvailable(null);

      checkUsernameAvailability(username)
        .then((result) => {
          if (cancelled) return;
          setUsernameAvailable(result.available);
          setUsernameSuggestions(result.suggestions ?? []);
        })
        .catch(() => {
          // The admin defaults to available on error rather than blocking
          // the form on a transient network failure.
          if (cancelled) return;
          setUsernameAvailable(true);
          setUsernameSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setIsCheckingUsername(false);
        });
    }, USERNAME_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (usernameTimer.current) window.clearTimeout(usernameTimer.current);
    };
  }, [username]);

  const applySuggestion = useCallback((suggestion: string) => {
    setUsernameState(suggestion);
    setUsernameDirty(true);
    dirtyRef.current = true;
    // The server already told us this one is free — no need to re-ask.
    lastChecked.current = suggestion;
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
  }, []);

  const reset = useCallback(() => {
    setUsernameState("");
    setUsernameDirty(false);
    dirtyRef.current = false;
    lastChecked.current = null;
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setIsCheckingUsername(false);
  }, []);

  const tooShort = username.length < USERNAME_MIN_LENGTH;

  return {
    username,
    isCheckingUsername: tooShort ? false : isCheckingUsername,
    usernameAvailable: tooShort ? null : usernameAvailable,
    usernameSuggestions: tooShort ? [] : usernameSuggestions,
    usernameDirty,
    setUsername,
    onFullNameChange,
    generateFromFullName,
    applySuggestion,
    reset,
  };
}
