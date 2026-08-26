/** Role union, matching diwine_admin_ui's core/models/auth.interface.ts. */
export type UserRole = "ADMIN" | "DL" | "SUPER" | "MASTER" | "USER" | "TEAMMATE";

export interface NavChild {
  id: string;
  label: string;
  href: string;
  /** Material Icons ligature — the same glyph names the Angular sidebar uses. */
  icon: string;
  roles?: UserRole[];
}

export interface NavItem {
  id: string;
  label: string;
  /** Key into SIDEBAR_ICONS (inline lucide geometry). */
  icon: SidebarIconName;
  /** Items with an `href` navigate; the rest expand an inline submenu. */
  href?: string;
  /**
   * Path prefix that keeps the row highlighted. `href` points at one default
   * page (`/clients/users`), but the row stays active across the whole section
   * — the Angular sidebar keys this off `activeSection`, not the exact route.
   */
  activePrefix?: string;
  children?: NavChild[];
  roles?: UserRole[];
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  roles?: UserRole[];
}

/** Lucide paths copied verbatim from sidebar.component.html. */
export const SIDEBAR_ICONS = {
  contact: [
    "M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    "M8 2v2",
    "M16 2v2",
  ],
  "kanban-square": [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M8 7v7",
    "M12 7v4",
    "M16 7v9",
  ],
  wallet: [
    "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
    "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
  ],
} as const;

export type SidebarIconName = keyof typeof SIDEBAR_ICONS;

/**
 * Sidebar model ported from diwine_admin_ui/src/app/admin/components/sidebar,
 * trimmed to the sections the CRM starts with. The Angular original hard-codes
 * every row and carries one @Input/@Output pair per menu; as data, role
 * filtering and submenu state become a single code path.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "dashboards",
    title: "Dashboards",
    items: [
      // Neither row carries a submenu, as in sidebar.component.html: Clients is
      // `handleClientsDirectClick()` (section 'clients' + option 'users') and
      // Create is a plain `handleSectionSelect('create')`. Both type lists live
      // in the page's own left column instead.
      {
        id: "clients",
        label: "Clients",
        icon: "contact",
        href: "/clients/users",
        activePrefix: "/clients",
      },
      {
        id: "create",
        label: "Create",
        icon: "kanban-square",
        href: "/create/user",
        activePrefix: "/create",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        id: "working-deposit-withdrawal",
        label: "Deposit Withdrawal",
        icon: "wallet",
        href: "/working-deposit-withdrawal",
      },
    ],
  },
];

/** Drops sections, items, and children the given role may not see. */
export function filterNavForRole(
  sections: NavSection[],
  role: UserRole | null,
): NavSection[] {
  const allowed = (roles?: UserRole[]) => !roles || (!!role && roles.includes(role));

  return sections
    .filter((section) => allowed(section.roles))
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => allowed(item.roles))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) => allowed(child.roles)),
        }))
        .filter((item) => !item.children || item.children.length > 0),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * How wide the sidebar starts on a given route.
 *
 * The Angular app encodes this in SCSS — `.main-content.clients-section-active`
 * sets `margin-left: var(--admin-sidebar-minimized-width)`, while the create
 * section keeps the full width. Here it is one lookup instead.
 *
 * `rail`: collapsed to icons, expands while hovered.
 * `expanded`: always full width.
 */
export type SidebarMode = "rail" | "expanded";

const SIDEBAR_MODE_BY_PREFIX: Array<[string, SidebarMode]> = [
  ["/clients", "rail"],
  ["/working-deposit-withdrawal", "rail"],
  ["/create", "expanded"],
];

export function sidebarModeForPath(pathname: string): SidebarMode {
  const match = SIDEBAR_MODE_BY_PREFIX.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  return match ? match[1] : "expanded";
}
