import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
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
        {/* Applies the stored theme before first paint so dark mode never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
