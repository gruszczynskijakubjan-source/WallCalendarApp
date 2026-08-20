import { Html, Head, Main, NextScript } from "next/document";

// Applied before hydration to avoid a flash of the wrong theme. Mirrors the
// holiday/seasonal logic in src/lib/theme.ts — kept inline (not imported)
// because it must run synchronously, before any JS bundle loads.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var valid = ["autumn", "winter", "spring", "summer", "christmas", "newyear", "valentines", "easter", "mayday"];
    var autoEnabled = localStorage.getItem("app-theme-auto") !== "false";
    var now = new Date();
    var month = now.getMonth();
    var date = now.getDate();
    var year = now.getFullYear();

    function easterSunday(y) {
      var a = y % 19, b = Math.floor(y / 100), c = y % 100;
      var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
      var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
      var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
      var m = Math.floor((a + 11 * h + 22 * l) / 451);
      var mo = Math.floor((h + l - 7 * m + 114) / 31);
      var da = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(y, mo - 1, da);
    }

    var holiday = null;
    if (autoEnabled) {
      if ((month === 11 && date === 31) || (month === 0 && date <= 2)) holiday = "newyear";
      else if (month === 11 && date >= 6 && date <= 30) holiday = "christmas";
      else if (month === 1 && date >= 10 && date <= 14) holiday = "valentines";
      else if (month === 4 && date >= 1 && date <= 3) holiday = "mayday";
      else {
        var easter = easterSunday(year);
        var offset = Math.round((Date.UTC(year, month, date) - Date.UTC(easter.getFullYear(), easter.getMonth(), easter.getDate())) / 86400000);
        if (offset >= -7 && offset <= 1) holiday = "easter";
      }
    }

    var theme = holiday;
    if (!theme) {
      var stored = localStorage.getItem("app-theme");
      theme = valid.indexOf(stored) !== -1 ? stored : null;
    }
    if (!theme) {
      theme = autoEnabled
        ? (month >= 2 && month <= 4 ? "spring"
          : month >= 5 && month <= 7 ? "summer"
          : month >= 8 && month <= 10 ? "autumn"
          : "winter")
        : "autumn";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="pl" className="antialiased">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </Head>
      <body className="min-h-full flex flex-col">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
