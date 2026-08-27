import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider, themeInitScript } from "@/lib/theme";

/* The app-wide face: diwine_admin_ui sets `--font-family: "Roboto Condensed"`
   on :root and applies it to <body>, so this is the only text face loaded. */
const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diwine CRM",
  description: "Diwine CRM admin workspace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${robotoCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Material Icons ligatures, as in diwine_admin_ui/src/index.html. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* Applies the stored theme before first paint so dark mode never
            flashes. Via next/script rather than a bare <script>: React 19 warns
            that a script rendered inside a component never executes on a client
            render, and beforeInteractive is the strategy that puts it in the
            server HTML ahead of any Next module — which is what the anti-flash
            behaviour actually depends on. An inline script needs an id. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full">
        {/* Auth wraps every route, login included: the login screen needs to
            know when a session already exists so it can bounce straight in. */}
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
