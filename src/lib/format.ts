import type { Lang } from "./copy.ts"

export const DEVELOPER_EMAIL = "alirezafazeli@live.com"

let activeLang: Lang = "en"

export function setActiveLang(lang: Lang) {
  activeLang = lang
}

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

const MONTHS_FA = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
]

const SHORT_FA = ["ژان", "فور", "مار", "آور", "مه", "ژوئن", "ژوئ", "اوت", "سپت", "اکت", "نوا", "دسا"]

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WEEKDAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]

function months(): string[] {
  return activeLang === "fa" ? MONTHS_FA : MONTHS
}

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
  return months()[index] ?? ""
}

export function shortMonth(index: number): string {
  if (activeLang === "fa") return SHORT_FA[index] ?? ""
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
  return `${months()[month - 1]} ${year}`
}

export function labelYearMonth(year: number, month: number): string {
  return `${months()[month - 1] ?? ""} ${year}`
}

export function labelYmd(year: string, month: string, day: string): string {
  return `${Number(day)} ${months()[Number(month) - 1] ?? ""} ${Number(year)}`
}

export function labelIsoDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-")
  return labelYmd(y, String(Number(m)), String(Number(d)))
}

export function weekdayIso(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  const names = activeLang === "fa" ? WEEKDAYS_FA : WEEKDAYS
  return names[date.getDay()] ?? ""
}

export function hourLabel(iso: string): string {
  return iso.slice(11, 16)
}

export function coordPair(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S"
  const ew = lon >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(3)}° ${ns} · ${Math.abs(lon).toFixed(3)}° ${ew}`
}

const WEATHER_FA: Record<number, string> = {
  0: "صاف",
  1: "عمدتاً صاف",
  2: "نیمه‌ابری",
  3: "ابری",
  45: "مه",
  48: "مه یخی",
  51: "نم‌باران خفیف",
  53: "نم‌باران",
  55: "نم‌باران شدید",
  56: "نم‌باران یخ‌زن",
  57: "نم‌باران یخ‌زن شدید",
  61: "باران خفیف",
  63: "باران",
  65: "باران شدید",
  66: "باران یخ‌زن خفیف",
  67: "باران یخ‌زن شدید",
  71: "برف خفیف",
  73: "برف",
  75: "برف شدید",
  77: "دانه‌برف",
  80: "رگبار",
  81: "رگبار متوسط",
  82: "رگبار شدید",
  85: "رگبار برف",
  86: "رگبار برف شدید",
  95: "توفان تندری",
  96: "توفان تندری با تگرگ",
  99: "توفان تندری شدید",
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
  const names = activeLang === "fa" ? WEATHER_FA : table
  return names[code] ?? (activeLang === "fa" ? "متغیر" : "Variable")
}

export function windDir(deg: number): string {
  const dirs = activeLang === "fa"
    ? ["شمال", "شمال‌شرقی", "شرق", "جنوب‌شرقی", "جنوب", "جنوب‌غربی", "غرب", "شمال‌غربی"]
    : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8] ?? "—"
}

export function aqiTone(aqi: number): { label: string; tone: string } {
  const fa = activeLang === "fa"
  if (aqi <= 20) return { label: fa ? "خوب" : "Good", tone: "good" }
  if (aqi <= 40) return { label: fa ? "قابل قبول" : "Fair", tone: "fair" }
  if (aqi <= 60) return { label: fa ? "متوسط" : "Moderate", tone: "mid" }
  if (aqi <= 80) return { label: fa ? "ضعیف" : "Poor", tone: "poor" }
  if (aqi <= 100) return { label: fa ? "بسیار ضعیف" : "Very poor", tone: "bad" }
  return { label: fa ? "بسیار ناسالم" : "Extremely poor", tone: "worse" }
}

export function uvLabel(uv: number): string {
  const fa = activeLang === "fa"
  if (uv < 3) return fa ? "کم" : "Low"
  if (uv < 6) return fa ? "متوسط" : "Moderate"
  if (uv < 8) return fa ? "زیاد" : "High"
  if (uv < 11) return fa ? "بسیار زیاد" : "Very high"
  return fa ? "شدید" : "Extreme"
}

function clockLocale(): string {
  return activeLang === "fa" ? "fa-IR-u-ca-gregory-nu-latn" : "en-GB"
}

export function utcStamp(date = new Date()): string {
  const stamp = new Intl.DateTimeFormat(clockLocale(), {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date)
  return `${stamp} UTC`
}

export function localClock(timeZone: string, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat(clockLocale(), {
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
