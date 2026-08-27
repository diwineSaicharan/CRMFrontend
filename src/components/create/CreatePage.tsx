"use client";

import Link from "next/link";

import {
  CREATE_LABELS,
  CREATE_NAV_OPTIONS,
  type CreateEntityKey,
} from "./create-nav.config";
import { HeaderSlot } from "@/components/layout/HeaderSlot";
import { CreateUserForm } from "./CreateUserForm";

/**
 * One form. The normal / dummy-platform distinction is a toggle inside it, not
 * a separate nav entry — see `isRootUser` in CreateUserForm.
 */
const FORMS: Record<CreateEntityKey, () => React.JSX.Element> = {
  user: CreateUserForm,
};

const NAV_ITEM =
  "mb-2 flex h-8 min-h-9 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent " +
  "px-3 py-1 text-left text-headings transition-colors hover:bg-accent/20 " +
  "dark:text-[#bde1ff] dark:hover:bg-[rgba(0,145,255,0.15)]";

// `.create-nav-item.active-menu` dark: rgba(0,98,198,0.25) with #D8EEFF ink.
const NAV_ITEM_ACTIVE =
  "bg-accent/20 dark:bg-[rgba(0,98,198,0.25)] dark:text-[#D8EEFF]";

/*
 * No top gap on the page container. The reference *looks* like it has one —
 * `.main-content.create-section-active` declares `--create-content-top-gap:
 * 60px` and applies it as
 * `padding: var(--create-content-top-gap) 0 0 var(--create-content-left-gap)`.
 * But `--create-content-left-gap` is commented out and never defined, so that
 * shorthand is invalid at computed-value time and the whole `padding`
 * declaration is dropped, leaving 0. Copying the 60px pushed this page down
 * relative to the panel it is meant to match.
 */
export function CreatePage({ entity }: { entity: CreateEntityKey }) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* ── toolbar ──────────────────────────────────────────────────────────
          In the shell header, so the heading shares the row with the global
          Deposit / Withdrawal switch rather than occupying one of its own.
          Line-height drops to `none` here: `leading-[2.2]` existed to give the
          heading its own band, which the header row now provides. */}
      <HeaderSlot>
        <div className="flex w-full min-w-0 items-center gap-5 min-[1440px]:pl-[0.7rem]">
          <h2 className="m-0 shrink-0 text-[17px] leading-none font-medium whitespace-nowrap text-headings dark:text-[#bde1ff]">
            Create {CREATE_LABELS[entity]}
          </h2>
        </div>
      </HeaderSlot>

      {/* ── glass card: type nav + form ──────────────────────────────────── */}
      <div className="grid h-auto min-h-0 min-w-0 flex-1 grid-cols-[15rem_minmax(0,1fr)] gap-x-[15px] gap-y-0 overflow-hidden rounded-2xl border border-white bg-white/30 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-[10px] max-lg:flex max-lg:flex-col dark:border-[rgba(0,145,255,0.15)] dark:bg-transparent dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]">
        <aside className="relative z-30 col-start-1 row-start-1 box-border min-h-0 w-60 max-w-60 overflow-x-hidden overflow-y-auto bg-transparent p-0 max-lg:w-full max-lg:max-w-full max-lg:shrink-0">
          <h3 className="m-0 mb-4 text-[15px] font-normal text-headings dark:text-[#bde1ff]">
            Create
          </h3>

          {CREATE_NAV_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/create/${option.value}`}
              className={
                NAV_ITEM + (entity === option.value ? " " + NAV_ITEM_ACTIVE : "")
              }
            >
              {option.ligature ? (
                <span className="material-icons shrink-0 text-[15px]">{option.icon}</span>
              ) : (
                /* Figma exports wrapping a base64 PNG — nothing to inline, so
                   `.icon-img` recolours them for dark mode instead. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.icon}
                  alt=""
                  className="icon-img h-[18px] w-[18px] shrink-0"
                />
              )}
              <span className="flex-1 truncate">{option.label}</span>
            </Link>
          ))}
        </aside>

        {/* `.custom-section` — the inner tinted panel the form scrolls inside. */}
        <div className="relative z-[1] col-start-2 row-start-1 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-[rgba(238,243,239,0.4)] p-4 dark:bg-[rgba(0,145,255,0.06)]">
          {(() => {
            const Form = FORMS[entity];
            return Form ? (
              <Form />
            ) : (
              <p className="p-4 text-sm text-muted dark:text-[#4e8dc1]">
                The {CREATE_LABELS[entity]} form is not ported yet.
              </p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
