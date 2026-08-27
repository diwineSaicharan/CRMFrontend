"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useMemo, useState } from "react";

import {
  NAV_SECTIONS,
  SIDEBAR_ICONS,
  filterNavForRole,
  type SidebarIconName,
  type UserRole,
} from "@/lib/nav-config";
import styles from "./Sidebar.module.css";

/* Class strings below are lifted from sidebar.component.html so the pill
   chrome, gradient wash and accent colours match the admin panel exactly. */

const NAV_BUTTON =
  "sidebar-button group relative grid grid-cols-[24px_minmax(0,1fr)_auto] grid-rows-[minmax(24px,auto)_auto] " +
  "items-center gap-x-1.5 w-full min-h-[40px] py-2 px-3 shrink-0 rounded-full cursor-pointer bg-transparent " +
  "text-left transition-[background,box-shadow,border-radius] duration-[180ms] " +
  "before:content-[''] before:absolute before:inset-px before:z-0 before:rounded-[inherit] before:scale-90 " +
  "before:opacity-0 before:pointer-events-none before:transition-all before:duration-300 " +
  "before:bg-gradient-to-r before:from-white/90 before:to-white/40 " +
  "before:shadow-[0_0_0_3px_rgba(255,255,255,0.3)] " +
  "dark:before:from-[#0091ff40] dark:before:to-[#0091ff0d] dark:before:shadow-[0_0_0_3px_rgba(0,145,255,0.05)] " +
  "hover:before:opacity-100 hover:before:scale-100 data-[menu-open=true]:hover:before:opacity-0";

const NAV_ICON =
  "me-2.5 shrink-0 relative z-[2] ml-[5px] col-start-1 row-start-1 justify-self-center " +
  "text-[#214055] dark:text-[#b7d8f6] " +
  "group-data-[active=true]:text-[#05a2a1] dark:group-data-[active=true]:text-[#0398ff]";

const NAV_LABEL =
  "button-text col-start-2 row-start-1 flex items-center self-center flex-1 min-w-0 relative z-[1] " +
  "text-[15px] font-normal leading-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] " +
  "transition-colors duration-[180ms] text-[#1d4268] dark:text-[#bde1ff] " +
  "group-data-[active=true]:text-[#05a2a1] dark:group-data-[active=true]:text-[#0398ff]";

const CHEVRON =
  "material-icons chevron-icon col-start-3 row-start-1 inline-flex items-center justify-center self-center " +
  "relative z-[1] text-[18px] max-w-[18px] overflow-hidden text-[#60798b] dark:text-[#bde1ff] " +
  "transition-transform duration-200 data-[rotated=true]:rotate-90 " +
  "data-[rotated=true]:text-[#05a2a1] dark:data-[rotated=true]:text-[#0398ff]";

const SUBMENU =
  "create-menu col-span-full row-start-2 w-auto rounded-xl relative flex flex-col gap-0.5 overflow-hidden " +
  "bg-[linear-gradient(to_top,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.5)_48%,rgba(255,255,255,0)_100%)] " +
  "dark:bg-[linear-gradient(to_top,rgba(0,145,255,0.18)_0%,rgba(0,145,255,0.08)_48%,rgba(0,145,255,0)_100%)] " +
  "mt-2 mr-[18px] mb-1.5 ml-[18px] pt-2 px-2 pb-2.5";

const SUBMENU_OPTION =
  "group/opt create-option flex items-center min-h-[28px] py-1 px-2 rounded-full cursor-pointer " +
  "transition-all duration-[180ms] text-[0.875rem] font-normal leading-5 whitespace-nowrap overflow-hidden " +
  "text-[#1d4268] dark:text-[#bde1ff] hover:bg-white/40 dark:hover:bg-[#0091ff1c] " +
  "data-[active=true]:bg-white/40 dark:data-[active=true]:bg-[#0091ff1c] " +
  "data-[active=true]:text-[#05a2a1] dark:data-[active=true]:text-[#0398ff] data-[active=true]:font-medium";

const SUBMENU_ICON =
  "material-icons create-option-icon w-4 h-[18px] text-xs mr-2 text-[#667783] shrink-0 " +
  "group-data-[active=true]/opt:text-[#05a2a1] dark:group-data-[active=true]/opt:text-[#0398ff]";

function SidebarIcon({
  name,
  className,
}: {
  name: SidebarIconName;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {SIDEBAR_ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export interface SidebarProps {
  /** Rail mode: icons only. The shell expands it on hover. */
  isMinimized?: boolean;
  /** True on routes that collapse the sidebar to a rail. */
  isRail?: boolean;
  userRole?: UserRole | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function Sidebar({
  isMinimized = false,
  isRail = false,
  userRole = "ADMIN",
  onMouseEnter,
  onMouseLeave,
}: SidebarProps) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const sections = useMemo(
    () => filterNavForRole(NAV_SECTIONS, userRole, permissions),
    [userRole, permissions],
  );

  // Disclosure state only. The route decides what is *active*, so a menu can be
  // opened for a peek without leaving the current page.
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (id: string) =>
    setOpenMenus((open) =>
      open.includes(id) ? open.filter((entry) => entry !== id) : [...open, id],
    );

  const isHrefActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  /*
   * Box metrics come from sidebar.component.scss, not admin.component.scss.
   * The latter's `.sidebar { padding: 16px 2px 16px 16px }` is nested plainly
   * inside `.background-container`, so Angular's emulated encapsulation scopes
   * it to AdminComponent's own template and it never reaches SidebarComponent's
   * markup. The rule that actually renders is `padding: 2px 10px` with
   * `width: 14rem`. Copying the 16px/2px version pushed the whole rail down and
   * threw the icons off-centre: the symmetric 10px is what lands each glyph's
   * margin box on the 32px midpoint of the 4rem rail.
   */
  return (
    <aside
      className={
        // The transition itself lives in the module: the reference runs width /
        // padding / background on a 520ms curve and the surface properties on a
        // separate 360ms one, which a single utility cannot express.
        styles.sidebar +
        " fixed top-0 left-0 z-[200] flex h-screen flex-col overflow-hidden px-[10px] py-0.5 " +
        (isMinimized
          ? "w-[var(--shell-sidebar-minimized-width)]"
          : // 14rem, per `.sidebar`; the workspace still offsets by the wider
            // --shell-sidebar-width, exactly as .main-content does.
            "w-56 rounded-r-2xl") +
        // Expanded over the page, it needs its own surface to stay readable.
        (isRail && !isMinimized
          ? " " + styles.railExpanded + " backdrop-blur-[16px]"
          : "")
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="shell-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="mt-0.5 grid h-14 shrink-0 grid-cols-[24px_minmax(0,1fr)] items-center px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icons/SB.svg" alt="" className="block h-5 w-5" />
          {!isMinimized && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/assets/icons/stakeBazzaarOnlyLetter.svg"
              alt="StakeBazzaar"
              className="ml-1 h-3.5 w-[94px] shrink-0"
            />
          )}
        </div>

        <nav className="sidebar-nav flex flex-col gap-4 pt-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="sidebar-section flex w-full shrink-0 flex-col gap-0"
            >
              {!isMinimized && (
                <div className="sidebar-section-title mb-[9px] flex h-5 items-center px-3 text-xs leading-4 whitespace-nowrap text-[#6a95b9] dark:text-[#4e8dc1]">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const childActive = item.children?.some((child) =>
                  isHrefActive(child.href),
                );
                const active = item.href
                  ? isHrefActive(item.activePrefix ?? item.href)
                  : !!childActive;
                const isOpen = openMenus.includes(item.id) || !!childActive;

                // A destination: the whole row is the link. Clients and Create
                // are both this shape — their type lists live in the page's own
                // left column, not in a sidebar flyout.
                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-active={active}
                      className={NAV_BUTTON}
                      title={isMinimized ? item.label : undefined}
                    >
                      <SidebarIcon name={item.icon} className={NAV_ICON} />
                      {!isMinimized && <span className={NAV_LABEL}>{item.label}</span>}
                    </Link>
                  );
                }

                // A pure disclosure (Operator, Exposure, … in the full nav):
                // no page of its own, just a flyout of options.
                return (
                  <div
                    key={item.id}
                    data-active={active}
                    data-menu-open={isOpen}
                    className={NAV_BUTTON}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.id)}
                      aria-expanded={isOpen}
                      title={isMinimized ? item.label : undefined}
                      className="col-span-full row-start-1 grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-1.5 text-left focus-visible:outline-none"
                    >
                      <SidebarIcon name={item.icon} className={NAV_ICON} />
                      {!isMinimized && (
                        <>
                          <span className={NAV_LABEL}>{item.label}</span>
                          <span className={CHEVRON} data-rotated={isOpen}>
                            chevron_right
                          </span>
                        </>
                      )}
                    </button>

                    {isOpen && !isMinimized && (
                      <div className={SUBMENU}>
                        {item.children?.map((child) => {
                          const childIsActive = isHrefActive(child.href);
                          return (
                            <Link
                              key={child.id}
                              href={child.href}
                              data-active={childIsActive}
                              className={SUBMENU_OPTION}
                            >
                              <span className={SUBMENU_ICON}>{child.icon}</span>
                              <span className="create-option-label min-w-0 flex-1 overflow-hidden text-sm text-ellipsis">
                                {child.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
