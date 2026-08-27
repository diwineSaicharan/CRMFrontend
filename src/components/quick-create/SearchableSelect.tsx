"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A `<select>` you can type into.
 *
 * The native control has no filtering, so a list of a few hundred users is
 * unusable — this keeps the same one-field footprint but turns the closed
 * control into a search box the moment it opens, exactly as the user-picker
 * further down the modal already behaves.
 *
 * The popup is rendered through a portal onto `document.body` and positioned
 * from the trigger's bounding rect. It has to be: the modal's field area is
 * `overflow-y-auto`, which CLIPS an absolutely positioned child no matter how
 * high its z-index goes — that is what cut the Category options off. Being
 * outside that subtree also means it opens above the trigger when there is not
 * enough room below, instead of overflowing the sheet.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown in the list while the options are still loading. */
  loading?: boolean;
  /** Classes for the closed control, so it matches the sibling fields. */
  className?: string;
  disabled?: boolean;
}

/** Tallest the list may get before it scrolls internally. */
const MAX_LIST_HEIGHT = 220;
/** Breathing room so the list never sits flush against the viewport edge. */
const VIEWPORT_MARGIN = 8;

interface PopupBox {
  left: number;
  width: number;
  /** Set when opening downward. */
  top?: number;
  /** Set when opening upward, measured from the bottom of the viewport. */
  bottom?: number;
  maxHeight: number;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "-- Select an option --",
  loading = false,
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** Which row the keyboard is on; -1 while nothing is highlighted. */
  const [activeIndex, setActiveIndex] = useState(-1);
  const [box, setBox] = useState<PopupBox | null>(null);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  /** Places the list below the trigger, or above it when below will not fit. */
  const position = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = rect.top - VIEWPORT_MARGIN;
    const openUp = below < Math.min(MAX_LIST_HEIGHT, above);

    setBox({
      left: rect.left,
      width: rect.width,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      maxHeight: Math.min(MAX_LIST_HEIGHT, Math.max(openUp ? above : below, 120)),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position, filtered.length]);

  // The trigger moves when anything behind the popup scrolls or the window
  // resizes; `capture` catches scrolls on the modal's own scroll container too.
  useEffect(() => {
    if (!open) return;
    const onMove = () => position();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, position]);

  // Close on an outside click. `mousedown` rather than `click` so selecting
  // text inside the popup and releasing outside does not dismiss it.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = (option: SelectOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return filtered.length - 1;
        if (next >= filtered.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option =
        filtered[activeIndex] ?? (filtered.length === 1 ? filtered[0] : null);
      if (option) commit(option);
    }
  };

  const popup =
    // No mount flag needed: the popup only opens on a click, which cannot
    // happen before hydration, so `document` is always there by this point.
    open && box && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popupRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              left: box.left,
              width: box.width,
              ...(box.top !== undefined ? { top: box.top } : {}),
              ...(box.bottom !== undefined ? { bottom: box.bottom } : {}),
              maxHeight: box.maxHeight,
            }}
            // Above the modal's own z-[150] so it is never painted behind it.
            className="shell-scroll z-[400] overflow-y-auto rounded-[10px] border border-white/90 bg-white/95 shadow-[0_12px_30px_rgba(20,60,95,0.16)] backdrop-blur-[12px] dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,43,82,0.97)]"
          >
            {loading && (
              <div className="px-[13px] py-[10px] font-condensed text-[13px] text-[#1d4268] dark:text-[#9ed4ff]">
                Loading…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="px-[13px] py-[10px] font-condensed text-[13px] text-[#1d4268] dark:text-[#9ed4ff]">
                No matches
              </div>
            )}

            {!loading &&
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option)}
                    className={
                      "block w-full cursor-pointer px-[13px] py-[10px] text-left font-condensed text-[13px] " +
                      "text-[#1d4268] dark:text-[#9ed4ff] " +
                      (isActive || isSelected
                        ? "bg-[rgba(47,128,214,0.14)] dark:bg-[rgba(0,145,255,0.22)]"
                        : "")
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={triggerRef} className="relative">
      {open ? (
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          className={className}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder={selected ? selected.label : placeholder}
          autoComplete="off"
        />
      ) : (
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded="false"
          aria-controls={listId}
          disabled={disabled}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          // `text-left` and the caret keep it looking like the native control
          // it replaces; the shared field classes supply everything else.
          className={className + " flex items-center justify-between text-left"}
        >
          <span className={selected ? "" : "opacity-70"}>
            {selected ? selected.label : placeholder}
          </span>
          <span aria-hidden="true" className="ms-2 shrink-0 text-[10px] opacity-70">
            ▼
          </span>
        </button>
      )}

      {popup}
    </div>
  );
}
