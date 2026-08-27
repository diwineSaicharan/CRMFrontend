"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

import { authApi } from "@/lib/auth";
import { formatIndianCurrency, type DlUser } from "@/lib/dl-users";
import { loadRatioOperators, type Operator } from "@/lib/operators";
import { getAllPlatforms, type Platform } from "@/lib/platforms";

/**
 * The machinery every create form repeats: the platform list, the two operator
 * ratio tables, a searchable parent picker, and the admin-password gate.
 *
 * Extracted after DL and Super, so those two still carry their own copies. The
 * behaviour here is the same; they can adopt this without a visual change.
 */
export interface UseCreateFormOptions {
  /** Loader for the parent picker — DLs for Super, Supers for Master, etc. */
  loadParents?: () => Promise<DlUser[]>;
  /**
   * The dropdown wrapper, owned by the component. Passed in rather than
   * returned: a ref reached through a returned object reads as a render-phase
   * ref access to the react-hooks lint rules at every use site.
   */
  parentContainerRef?: RefObject<HTMLDivElement | null>;
}

export function useCreateForm({
  loadParents,
  parentContainerRef,
}: UseCreateFormOptions = {}) {
  // ── platforms ─────────────────────────────────────────────────────────────
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [platformReload, setPlatformReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAllPlatforms(true)
      .then((platforms) => {
        if (cancelled) return;
        setAvailablePlatforms(platforms);
        setPlatformsError(null);
      })
      .catch(() => {
        if (!cancelled) setPlatformsError("Failed to load platforms");
      })
      .finally(() => {
        if (!cancelled) setLoadingPlatforms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platformReload]);

  const togglePlatform = (id: string) =>
    setSelectedPlatformIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const reloadPlatforms = () => {
    setLoadingPlatforms(true);
    setPlatformsError(null);
    setPlatformReload((n) => n + 1);
  };

  const areAllPlatformsSelected =
    availablePlatforms.length > 0 &&
    selectedPlatformIds.length === availablePlatforms.length;

  // ── operator ratios ───────────────────────────────────────────────────────
  const [casinoOperators, setCasinoOperators] = useState<Operator[]>([]);
  const [sportsOperators, setSportsOperators] = useState<Operator[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorState, setOperatorState] = useState<
    Record<string, { enabled: boolean; commission: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    loadRatioOperators()
      .then(({ casino, sports }) => {
        if (cancelled) return;
        setCasinoOperators(casino);
        setSportsOperators(sports);
      })
      .finally(() => {
        if (!cancelled) setLoadingOperators(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isOperatorSelected = (operatorId: string) =>
    operatorState[operatorId]?.enabled ?? false;

  const getOperatorCommission = (operatorId: string) =>
    operatorState[operatorId]?.commission ?? 0;

  const toggleOperator = (operatorId: string) =>
    setOperatorState((current) => ({
      ...current,
      [operatorId]: {
        commission: current[operatorId]?.commission ?? 0,
        enabled: !current[operatorId]?.enabled,
      },
    }));

  const setOperatorCommission = (operatorId: string, commission: number) =>
    setOperatorState((current) => ({
      ...current,
      [operatorId]: { enabled: current[operatorId]?.enabled ?? false, commission },
    }));

  /** `onGlobalRatioChange` — seeds every *enabled* operator with the value. */
  const seedOperatorRatios = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    setOperatorState((current) => {
      const next = { ...current };
      for (const [operatorId, state] of Object.entries(next)) {
        if (state.enabled) next[operatorId] = { ...state, commission: parsed };
      }
      return next;
    });
  };

  const enabledRatios = (list: Operator[]) =>
    list
      .filter((operator) => isOperatorSelected(operator.operatorId))
      .map((operator) => ({
        operatorId: operator.operatorId,
        commission: getOperatorCommission(operator.operatorId),
      }));

  // ── parent picker ─────────────────────────────────────────────────────────
  const [parents, setParents] = useState<DlUser[]>([]);
  const [loadingParents, setLoadingParents] = useState(Boolean(loadParents));
  const [parentsError, setParentsError] = useState<string | null>(null);
  const [parentReload, setParentReload] = useState(0);
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState("");

  useEffect(() => {
    if (!loadParents) return;
    let cancelled = false;

    loadParents()
      .then((rows) => {
        if (cancelled) return;
        setParents(rows);
        setParentsError(null);
      })
      .catch(() => {
        if (!cancelled) setParentsError("Failed to load list. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingParents(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentReload]);

  // `(clickOutside)="closeDropdown()"` on the Angular dropdown panel.
  useEffect(() => {
    if (!parentDropdownOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!parentContainerRef?.current?.contains(event.target as Node)) {
        setParentDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [parentDropdownOpen, parentContainerRef]);

  const filteredParents = useMemo(() => {
    const term = parentSearchTerm.trim().toLowerCase();
    if (!term) return parents;
    return parents.filter(
      (row) =>
        row.username.toLowerCase().includes(term) ||
        (row.fullName ?? "").toLowerCase().includes(term),
    );
  }, [parents, parentSearchTerm]);

  const reloadParents = () => {
    setLoadingParents(true);
    setParentsError(null);
    setParentReload((n) => n + 1);
  };

  const parentDisplayText = (parentId: string) => {
    const match = parents.find((row) => row.id === parentId);
    return match ? `${match.username} (${match.fullName ?? ""})` : "";
  };

  // ── admin password gate ───────────────────────────────────────────────────
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(
    null,
  );

  const openAdminPasswordModal = (payload: Record<string, unknown>) => {
    setPendingPayload(payload);
    setAdminPasswordInput("");
    setAdminPasswordError(null);
    setShowAdminPasswordModal(true);
  };

  const closeAdminPasswordModal = () => {
    setShowAdminPasswordModal(false);
    setAdminPasswordInput("");
    setAdminPasswordError(null);
    setPendingPayload(null);
  };

  /** Verifies, then hands the stashed payload to `onVerified`. */
  const confirmAdminPassword = async (
    onVerified: (payload: Record<string, unknown> | null) => void,
  ) => {
    if (!adminPasswordInput.trim()) {
      setAdminPasswordError("Please enter your password");
      return;
    }

    setAdminPasswordError(null);
    setIsVerifying(true);

    try {
      const result = await authApi.verifyPassword(adminPasswordInput);

      if (!result?.success) {
        setAdminPasswordError("Incorrect password. Please try again.");
        return;
      }

      setShowAdminPasswordModal(false);
      setAdminPasswordInput("");
      onVerified(pendingPayload);
    } catch {
      setAdminPasswordError("Incorrect password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetShared = () => {
    setSelectedPlatformIds([]);
    setOperatorState({});
    setParentSearchTerm("");
    setParentDropdownOpen(false);
  };

  return {
    availablePlatforms,
    selectedPlatformIds,
    loadingPlatforms,
    platformsError,
    togglePlatform,
    reloadPlatforms,
    areAllPlatformsSelected,
    setSelectedPlatformIds,

    casinoOperators,
    sportsOperators,
    loadingOperators,
    isOperatorSelected,
    getOperatorCommission,
    toggleOperator,
    setOperatorCommission,
    seedOperatorRatios,
    enabledRatios,

    parents,
    filteredParents,
    loadingParents,
    parentsError,
    parentDropdownOpen,
    setParentDropdownOpen,
    parentSearchTerm,
    setParentSearchTerm,
    reloadParents,
    parentDisplayText,
    formatIndianCurrency,

    showAdminPasswordModal,
    adminPasswordInput,
    setAdminPasswordInput,
    adminPasswordError,
    setAdminPasswordError,
    isVerifying,
    showAdminPassword,
    setShowAdminPassword,
    openAdminPasswordModal,
    closeAdminPasswordModal,
    confirmAdminPassword,

    resetShared,
  };
}
