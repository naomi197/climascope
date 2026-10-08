export const DEVELOPER_EMAIL = "alirezafazeli@live.com"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—"
  const d = Math.abs(n) >= 100 ? 0 : digits
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(n)
}

export function fmtSigned(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—"
  const body = fmt(Math.abs(n), digits)
  if (n > 0) return `+${body}`
  if (n < 0) return `−${body}`
  return body
}

export function monthName(index: number): string {
  return MONTHS[index] ?? ""
}

export function shortMonth(index: number): string {
  return (MONTHS[index] ?? "").slice(0, 3)
}

export function parseDecimalMonth(value: string): { year: number; month: number } {
  const [yearPart, monthPart] = value.split(".")
  return { year: Number(yearPart), month: Number(monthPart) }
}

export function labelDecimalYear(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const year = Math.floor(n)
  const month = Math.min(12, Math.max(1, Math.round((n - year) * 12)))
  return `${MONTHS[month - 1]} ${year}`
}

export function labelYearMonth(year: number, month: number): string {
  return `${MONTHS[month - 1] ?? ""} ${year}`
}

export function labelYmd(year: string, month: string, day: string): string {
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""} ${Number(year)}`
}

export function labelIsoDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-")
  return labelYmd(y, String(Number(m)), String(Number(d)))
}

export function weekdayIso(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return WEEKDAYS[date.getDay()] ?? ""
}

export function hourLabel(iso: string): string {
  return iso.slice(11, 16)
}

export function coordPair(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S"
  const ew = lon >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(3)}° ${ns} · ${Math.abs(lon).toFixed(3)}° ${ew}`
}

export function weatherText(code: number): string {
  const table: Record<number, string> = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Moderate showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  }
  return table[code] ?? "Variable"
}

export function windDir(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8] ?? "—"
}

export function aqiTone(aqi: number): { label: string; tone: string } {
  if (aqi <= 20) return { label: "Good", tone: "good" }
  if (aqi <= 40) return { label: "Fair", tone: "fair" }
  if (aqi <= 60) return { label: "Moderate", tone: "mid" }
  if (aqi <= 80) return { label: "Poor", tone: "poor" }
  if (aqi <= 100) return { label: "Very poor", tone: "bad" }
  return { label: "Extremely poor", tone: "worse" }
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low"
  if (uv < 6) return "Moderate"
  if (uv < 8) return "High"
  if (uv < 11) return "Very high"
  return "Extreme"
}

export function localClock(timeZone: string, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return ""
  }
}
