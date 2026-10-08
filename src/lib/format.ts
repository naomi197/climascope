export const DEVELOPER_EMAIL = "alirezafazeli@live.cim"

const MONTHS = [
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

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—"
  const d = Math.abs(n) >= 100 ? 0 : digits
  return new Intl.NumberFormat("fa-IR", {
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
  return `${MONTHS[month - 1]} ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(year)}`
}

export function labelYearMonth(year: number, month: number): string {
  return `${MONTHS[month - 1] ?? ""} ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(year)}`
}

export function labelYmd(year: string, month: string, day: string): string {
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""} ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(Number(year))}`
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
  const ns = lat >= 0 ? "شمالی" : "جنوبی"
  const ew = lon >= 0 ? "شرقی" : "غربی"
  return `${Math.abs(lat).toFixed(3)}° ${ns} · ${Math.abs(lon).toFixed(3)}° ${ew}`
}

export function weatherFa(code: number): string {
  const table: Record<number, string> = {
    0: "آسمان صاف",
    1: "عمدتاً صاف",
    2: "نیمه‌ابری",
    3: "ابری",
    45: "مه",
    48: "مه یخی",
    51: "نم‌نم باران",
    53: "باران ریز",
    55: "باران ریز شدید",
    56: "نم‌نم یخی",
    57: "باران یخی",
    61: "باران ملایم",
    63: "باران",
    65: "باران شدید",
    66: "باران یخی ملایم",
    67: "باران یخی شدید",
    71: "برف ملایم",
    73: "برف",
    75: "برف شدید",
    77: "دانه برف",
    80: "رگبار",
    81: "رگبار متوسط",
    82: "رگبار شدید",
    85: "رگبار برف",
    86: "رگبار برف شدید",
    95: "رعدوبرق",
    96: "رعدوبرق با تگرگ",
    99: "رعدوبرق شدید",
  }
  return table[code] ?? "شرایط متغیر"
}

export function windDir(deg: number): string {
  const dirs = ["شمال", "شمال‌شرقی", "شرق", "جنوب‌شرقی", "جنوب", "جنوب‌غربی", "غرب", "شمال‌غربی"]
  return dirs[Math.round(deg / 45) % 8] ?? "—"
}

export function aqiTone(aqi: number): { label: string; tone: string } {
  if (aqi <= 20) return { label: "پاک", tone: "good" }
  if (aqi <= 40) return { label: "قابل قبول", tone: "fair" }
  if (aqi <= 60) return { label: "متوسط", tone: "mid" }
  if (aqi <= 80) return { label: "ناسالم", tone: "poor" }
  if (aqi <= 100) return { label: "بسیار ناسالم", tone: "bad" }
  return { label: "خطرناک", tone: "worse" }
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "کم"
  if (uv < 6) return "متوسط"
  if (uv < 8) return "زیاد"
  if (uv < 11) return "خیلی زیاد"
  return "شدید"
}

export function localClock(timeZone: string, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
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
