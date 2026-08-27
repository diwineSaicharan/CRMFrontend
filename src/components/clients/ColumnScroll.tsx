"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import styles from "./ClientDirectory.module.css";

/**
 * The client directory's overlay scrollbar, ported from
 * ClientColumnScrollHostDirective + `.client-column-scrollbar-*` in styles.scss.
 *
 * The scrolling element keeps its native scrollbar at zero width, exactly as
 * before — the visible 4px thumb is an absolutely positioned sibling inside the
 * column's existing wrapper. Nothing is added to the layout: no extra DOM node,
 * no gutter, no change to any column's width or position.
 */

/** `Math.max(..., 32)` in the directive's `updateThumb`. */
const MIN_THUMB_HEIGHT = 32;

interface ThumbGeometry {
  height: number;
  offset: number;
}

export interface ColumnScrollProps {
  /** Classes for the existing wrapper. It must establish a containing block. */
  hostClassName: string;
  /** Classes for the scrolling element itself. */
  className: string;
  /** Inset for the rail when the host is padded and the viewport is not the
      host's full height — without it the thumb travels over the padding too. */
  railClassName?: string;
  dir?: string;
  children: ReactNode;
}

export function ColumnScroll({
  hostClassName,
  className,
  railClassName,
  dir,
  children,
}: ColumnScrollProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  /** null while the column fits — the rail is not rendered at all, as in
      `rail.style.display = canScroll ? "" : "none"`. */
  const [thumb, setThumb] = useState<ThumbGeometry | null>(null);
  const [dragging, setDragging] = useState(false);

  const drag = useRef({
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    trackHeight: 0,
    thumbHeight: 0,
  });

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setThumb(null);
      return;
    }

    // Before the rail first renders there is no element to measure, so fall
    // back to the viewport height the rail will stretch to.
    const trackHeight = railRef.current?.clientHeight || clientHeight;
    const height = Math.min(
      trackHeight,
      Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT),
    );
    const maxScroll = scrollHeight - clientHeight;
    const maxOffset = Math.max(trackHeight - height, 0);
    const offset = maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * maxOffset;

    setThumb((current) =>
      current && current.height === height && current.offset === offset
        ? current
        : { height, offset },
    );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    // A ResizeObserver on the scroll element never fires when its *content*
    // grows, and the rows arrive from a fetch — the directive gets away with it
    // because a mouseenter re-measures, but the thumb should be right before
    // the pointer ever reaches the column.
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure]);

  // The first measure runs before the rail exists and has to guess the track
  // height; re-measure once it mounts so the guess cannot stick.
  const hasRail = thumb !== null;
  useEffect(() => {
    if (hasRail) measure();
  }, [hasRail, measure]);

  /** Maps a thumb-top offset within the rail back onto `scrollTop`. */
  const scrollToThumbOffset = useCallback((offset: number) => {
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const { scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const trackHeight = rail.clientHeight || clientHeight;
    const thumbHeight = Math.min(
      trackHeight,
      Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT),
    );
    const maxOffset = trackHeight - thumbHeight;
    if (maxScroll <= 0 || maxOffset <= 0) return;

    const clamped = Math.min(Math.max(offset, 0), maxOffset);
    el.scrollTop = (clamped / maxOffset) * maxScroll;
  }, []);

  const startDragging = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const trackHeight = rail.clientHeight || el.clientHeight;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: el.scrollTop,
      trackHeight,
      thumbHeight: Math.min(
        trackHeight,
        Math.max(
          (el.clientHeight / el.scrollHeight) * trackHeight,
          MIN_THUMB_HEIGHT,
        ),
      ),
    };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const el = scrollRef.current;
      if (!el || event.pointerId !== drag.current.pointerId) return;

      event.preventDefault();
      const maxScroll = el.scrollHeight - el.clientHeight;
      const maxOffset = drag.current.trackHeight - drag.current.thumbHeight;
      if (maxScroll <= 0 || maxOffset <= 0) return;

      const delta =
        ((event.clientY - drag.current.startY) / maxOffset) * maxScroll;
      el.scrollTop = Math.min(
        Math.max(drag.current.startScrollTop + delta, 0),
        maxScroll,
      );
    };

    const onEnd = (event: PointerEvent) => {
      if (event.pointerId !== drag.current.pointerId) return;
      drag.current.pointerId = -1;
      setDragging(false);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("pointercancel", onEnd);
    };
  }, [dragging]);

  /** Left button or touch only, matching `isPrimaryPointer`. */
  const isPrimary = (event: ReactPointerEvent<HTMLElement>) =>
    event.isPrimary !== false &&
    (event.button === 0 || event.pointerType === "touch");

  const onRailPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!thumb || !isPrimary(event)) return;
    event.preventDefault();

    // A click on bare track centres the thumb under the pointer first.
    const railRect = railRef.current?.getBoundingClientRect();
    if (railRect) {
      scrollToThumbOffset(event.clientY - railRect.top - thumb.height / 2);
    }
    startDragging(event);
  };

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!thumb || !isPrimary(event)) return;
    event.preventDefault();
    event.stopPropagation();
    startDragging(event);
  };

  return (
    <div className={styles.scrollHost + " " + hostClassName}>
      <div
        ref={scrollRef}
        dir={dir}
        className={styles.columnScroll + " " + className}
      >
        {children}
      </div>

      {thumb && (
        <div
          ref={railRef}
          aria-hidden="true"
          onPointerDown={onRailPointerDown}
          className={
            styles.scrollRail +
            (railClassName ? " " + railClassName : "") +
            (dragging ? " " + styles.isDragging : "")
          }
        >
          <div
            onPointerDown={onThumbPointerDown}
            className={styles.scrollThumb}
            style={{
              height: thumb.height,
              transform: `translateY(${thumb.offset}px)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
