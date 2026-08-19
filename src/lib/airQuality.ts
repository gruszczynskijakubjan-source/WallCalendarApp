export function describeAqi(aqi: number | null) {
  if (aqi === null) return null;
  if (aqi <= 20) return "Bardzo dobra";
  if (aqi <= 40) return "Dobra";
  if (aqi <= 60) return "Umiarkowana";
  if (aqi <= 80) return "Dostateczna";
  if (aqi <= 100) return "Zła";
  return "Bardzo zła";
}

export function aqiColor(aqi: number | null) {
  if (aqi === null) return "var(--foreground)";
  if (aqi <= 40) return "var(--accent-teal)";
  if (aqi <= 80) return "var(--accent-gold)";
  return "var(--accent-coral)";
}
