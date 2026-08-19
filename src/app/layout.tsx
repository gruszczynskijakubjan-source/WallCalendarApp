import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalendarz domowy",
  description: "Wspólny kalendarz i lista zadań rodziny",
};

// Applied before hydration to avoid a flash of the wrong theme.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("app-theme");
    var valid = ["autumn", "winter", "spring", "summer"];
    var theme = valid.indexOf(stored) !== -1 ? stored : null;
    if (!theme) {
      var month = new Date().getMonth();
      theme = month >= 2 && month <= 4 ? "spring"
        : month >= 5 && month <= 7 ? "summer"
        : month >= 8 && month <= 10 ? "autumn"
        : "winter";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
