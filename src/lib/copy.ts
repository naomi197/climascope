import { PRESETS, type Place } from "./api.ts"

export type Lang = "en" | "fa"

const STATIONS: Record<string, { name: string; admin: string; country: string }> = {
  Dhaka: { name: "داکا", admin: "بخش داکا", country: "بنگلادش" },
  Jakarta: { name: "جاکارتا", admin: "جاکارتا", country: "اندونزی" },
  Manaus: { name: "مانائوس", admin: "آمازوناس", country: "برزیل" },
  "Malé": { name: "ماله", admin: "کافو", country: "مالدیو" },
  Nuuk: { name: "نوک", admin: "سرمرسوک", country: "گرینلند" },
}

export function localizePlace(place: Place, lang: Lang): Place {
  if (lang !== "fa") return place
  const preset = PRESETS.find(
    (item) =>
      item.name === place.name &&
      Math.abs(item.latitude - place.latitude) < 0.02 &&
      Math.abs(item.longitude - place.longitude) < 0.02,
  )
  if (preset && STATIONS[preset.name]) return { ...place, ...STATIONS[preset.name] }
  if (place.name === "Selected point") return { ...place, name: "نقطه انتخاب‌شده" }
  return place
}

type Worked = {
  temp: string
  from: string
  to: string
  anomaly: string | null
  month: string
  spread: string
  precip: string | null
}

export type Copy = {
  running: string
  sources: string
  deck: string
  language: string
  globals: string
  globalsError: string
  co2: string
  ppmTrend: string
  cycle: (cycle: string, when: string) => string
  methane: string
  n2o: string
  ppbTrend: string
  anomaly: string
  landOcean: string
  seaIce: string
  iceUnit: string
  iceNote: (extent: string, when: string) => string
  placeOrCoordinates: string
  searchPlaceholder: string
  locate: string
  searching: string
  referenceStations: string
  mapCaption: string
  locationDenied: string
  locationUnavailable: string
  virtualStation: string
  desk: string
  briefing: string
  method: string
  elevation: (n: string) => string
  loadErrorTitle: string
  loadErrorBody: string
  tryAgain: string
  loading: string
  day: string
  night: string
  feelsLike: (n: string) => string
  todayRange: (min: string, max: string) => string
  monthDelta: (signed: string, month: string) => string
  observedNow: string
  currentParameters: string
  humidity: string
  dewPoint: string
  pressure: string
  wind: string
  gust: (n: string) => string
  precipitation: string
  cloudCover: string
  visibility: string
  uvIndex: string
  vpd: string
  et0: string
  cape: string
  radiation: string
  column: string
  airQuality: string
  europeanIndex: (us: string) => string
  ozone: string
  no2: string
  so2: string
  co: string
  dust: string
  aod: string
  fig1: string
  next24: string
  temperature: string
  fig2: string
  sevenDays: string
  high: string
  low: string
  rainLine: (mm: string, pct: string) => string
  windLine: (wind: string, uv: string, et: string) => string
  fig3: string
  climateOutlook: string
  ensembleHint: string
  climateError: string
  annualTempChange: string
  annualRange: (from: string, fromLabel: string, to: string, toLabel: string) => string
  annualPrecipChange: string
  precipRange: (from: string, to: string) => string
  monthlyTemp: string
  baselineYears: string
  futureYears: string
  spreadHint: (spread: string) => string
  monthlyPrecip: string
  model: string
  deltaT: string
  futureRain: string
  disclaimer: string
  hydrology: string
  riverDischarge: string
  glofas: string
  negligible: string
  record: string
  aboutTitle: string
  aboutBody: string
  developerLabel: string
  developerName: string
  email: string
  github: string
  aboutHint: string
  chartNow: string
  chartAhead: string
  chartPrecipNote: string
  chartHour: string
  chartClimate: string
  chartPrecip: string
  chartAqi: string
  chartRiver: string
  chartWeek: string
  methodTitle: string
  methodLead: string
  baseline: string
  future: string
  futureSpan: string
  between: string
  models: string
  temperatureDef: string
  precipDef: string
  spread: string
  spreadDef: string
  thisStation: string
  worked: (parts: Worked) => string
  methodLimit: string
}

const en: Copy = {
  running: "Climate observatory · HighResMIP grid means",
  sources: "Open-Meteo · GloFAS · global-warming.org",
  deck: "A station briefing for any point on Earth: the live atmosphere, the air column, river discharge, and a three-model decade comparison.",
  language: "Language",
  globals: "Global indicators",
  globalsError: "Global indicators are unavailable right now.",
  co2: "Carbon dioxide",
  ppmTrend: "ppm trend",
  cycle: (cycle, when) => `cycle ${cycle} · ${when}`,
  methane: "Methane",
  n2o: "Nitrous oxide",
  ppbTrend: "ppb trend",
  anomaly: "Temperature anomaly",
  landOcean: "°C land-ocean",
  seaIce: "Sea ice",
  iceUnit: "million km² anomaly",
  iceNote: (extent, when) => `${extent} extent · ${when}`,
  placeOrCoordinates: "Place or coordinates",
  searchPlaceholder: "City, or lat, lon",
  locate: "Locate",
  searching: "Searching the gazetteer…",
  referenceStations: "Reference stations",
  mapCaption: "Esri Dark Gray. Tap the chart to open that coordinate.",
  locationDenied: "Location permission was denied.",
  locationUnavailable: "Current location is unavailable. Search for a city or enter coordinates.",
  virtualStation: "Virtual station",
  desk: "Desk",
  briefing: "Briefing",
  method: "Method",
  elevation: (n) => `Elevation ${n} m`,
  loadErrorTitle: "This location could not be loaded",
  loadErrorBody: "Check the connection and try again.",
  tryAgain: "Try again",
  loading: "Loading observations",
  day: "Day",
  night: "Night",
  feelsLike: (n) => `Feels like ${n}°`,
  todayRange: (min, max) => `Today ${min}° to ${max}°`,
  monthDelta: (signed, month) => `${signed}° against the ${month} mean, 1991–2000`,
  observedNow: "Observed now",
  currentParameters: "Current parameters",
  humidity: "Humidity",
  dewPoint: "Dew point",
  pressure: "Sea-level pressure",
  wind: "Wind",
  gust: (n) => `Gust ${n}`,
  precipitation: "Precipitation",
  cloudCover: "Cloud cover",
  visibility: "Visibility",
  uvIndex: "UV index",
  vpd: "Vapor pressure deficit",
  et0: "Reference ET₀",
  cape: "Convective energy",
  radiation: "Shortwave radiation",
  column: "Column",
  airQuality: "Air quality",
  europeanIndex: (us) => `European index · US ${us}`,
  ozone: "Ozone",
  no2: "Nitrogen dioxide",
  so2: "Sulphur dioxide",
  co: "Carbon monoxide",
  dust: "Dust",
  aod: "Aerosol optical depth",
  fig1: "Fig. 1",
  next24: "Next 24 hours",
  temperature: "Temperature",
  fig2: "Fig. 2",
  sevenDays: "Seven days",
  high: "High",
  low: "Low",
  rainLine: (mm, pct) => `Rain ${mm} mm · ${pct}%`,
  windLine: (wind, uv, et) => `Wind ${wind} · UV ${uv} · ET₀ ${et}`,
  fig3: "Fig. 3",
  climateOutlook: "Climate outlook",
  ensembleHint: "Unweighted mean of three HighResMIP models",
  climateError: "The climate-model series failed to load for this point.",
  annualTempChange: "Annual temperature change",
  annualRange: (from, fromLabel, to, toLabel) => `${from}° in ${fromLabel} to ${to}° in ${toLabel}`,
  annualPrecipChange: "Annual precipitation change",
  precipRange: (from, to) => `${from} to ${to} mm`,
  monthlyTemp: "Monthly mean temperature",
  baselineYears: "1991–2000",
  futureYears: "2041–2050",
  spreadHint: (spread) => `The copper band is the spread across the three models in 2041–2050. Mean monthly spread ${spread}°C.`,
  monthlyPrecip: "Monthly precipitation",
  model: "Model",
  deltaT: "ΔT",
  futureRain: "Future rain",
  disclaimer:
    "Model-grid means, not station observations. HighResMIP through 2050 is not a substitute for CMIP6 scenarios or the IPCC reports when a decision has to be official. The reduction itself is in src/lib/outlook.ts.",
  hydrology: "Hydrology",
  riverDischarge: "River discharge",
  glofas: "GloFAS · nearest watercourse",
  negligible: "The nearest watercourse is negligible this week.",
  record: "Record",
  aboutTitle: "About this briefing",
  aboutBody:
    "ClimaScope keeps the forecast, the air column, GloFAS discharge, and the HighResMIP decade comparison on one sheet. Another project can import the ensemble without the map.",
  developerLabel: "Developer",
  developerName: "alireza fazeli sani",
  email: "Email",
  github: "GitHub",
  aboutHint:
    "Sources: Open-Meteo forecast, air quality, climate, and flood APIs; global-warming.org for CO₂, methane, N₂O, the GISS anomaly, and sea ice; Esri basemap. Version 1.2.1.",
  chartNow: "now",
  chartAhead: "+24 h",
  chartPrecipNote: "°C · bars are precipitation",
  chartHour: "Temperature and precipitation over the next 24 hours",
  chartClimate: "Monthly mean temperature, baseline and future ensemble",
  chartPrecip: "Monthly precipitation, baseline and future ensemble",
  chartAqi: "European air quality index",
  chartRiver: "River discharge over seven days",
  chartWeek: "Seven-day temperature range",
  methodTitle: "What the ensemble actually computes",
  methodLead:
    "ClimaScope is a station briefing joined to one reusable reduction of HighResMIP. For any coordinate it turns two decades of daily model output into a monthly ensemble mean, keeps the cross-model spread, and places today’s observation against the baseline month. The same reduction runs without this interface.",
  baseline: "Baseline",
  future: "Future",
  futureSpan: "The runs end in 2050.",
  between: "to",
  models: "Models",
  temperatureDef: "Daily mean, averaged inside each month and model, then an unweighted mean of the three models.",
  precipDef: "Daily totals summed inside each year, then averaged across the years of the decade. The monthly bars use the same year count.",
  spread: "Spread",
  spreadDef:
    "For each future month, the highest model minus the lowest. The shaded band is that range, not an uncertainty interval from a larger CMIP6 set.",
  thisStation: "This station",
  worked: (p) =>
    `The grid-cell mean changes by ${p.temp}°C from ${p.from} to ${p.to}.${p.anomaly != null ? ` The current temperature is ${p.anomaly}°C against the ${p.month} baseline.` : ""} Mean future monthly spread is ${p.spread}°C.${p.precip != null ? ` Annual precipitation changes by ${p.precip}%.` : ""}`,
  methodLimit:
    "These are model-grid means, not station observations, and not a substitute for CMIP6 scenarios or the IPCC reports when a decision has to be official. A worked fixture ships in examples/monthly-ensemble.ts. The checks in test/outlook.test.ts lock the monthly mean, the ignored missing days, and the decade delta.",
}

const fa: Copy = {
  running: "رصدخانه اقلیم · میانگین شبکه HighResMIP",
  sources: "Open-Meteo · GloFAS · global-warming.org",
  deck: "برگه یک ایستگاه برای هر نقطه از زمین: جو لحظه‌ای، ستون هوا، آبدهی رود، و مقایسه یک دهه با سه مدل.",
  language: "زبان",
  globals: "شاخص‌های جهانی",
  globalsError: "شاخص‌های جهانی فعلاً در دسترس نیستند.",
  co2: "کربن دی‌اکسید",
  ppmTrend: "روند ppm",
  cycle: (cycle, when) => `چرخه ${cycle} · ${when}`,
  methane: "متان",
  n2o: "نیتروز اکسید",
  ppbTrend: "روند ppb",
  anomaly: "ناهنجاری دما",
  landOcean: "°C خشکی و اقیانوس",
  seaIce: "یخ دریا",
  iceUnit: "ناهنجاری میلیون km²",
  iceNote: (extent, when) => `گستره ${extent} · ${when}`,
  placeOrCoordinates: "مکان یا مختصات",
  searchPlaceholder: "شهر، یا عرض، طول",
  locate: "مکان من",
  searching: "جستجو در فرهنگ جغرافیایی…",
  referenceStations: "ایستگاه‌های مرجع",
  mapCaption: "نقشه خاکستری Esri. روی نقشه بزنید تا همان مختصات باز شود.",
  locationDenied: "اجازه مکان رد شد.",
  locationUnavailable: "مکان فعلی در دسترس نیست. شهر را جستجو کنید یا مختصات وارد کنید.",
  virtualStation: "ایستگاه مجازی",
  desk: "میز کار",
  briefing: "برگه",
  method: "روش",
  elevation: (n) => `ارتفاع ${n} متر`,
  loadErrorTitle: "این مکان بار نشد",
  loadErrorBody: "اتصال را بررسی کنید و دوباره تلاش کنید.",
  tryAgain: "تلاش دوباره",
  loading: "در حال بار کردن مشاهده‌ها",
  day: "روز",
  night: "شب",
  feelsLike: (n) => `دمای محسوس ${n}°`,
  todayRange: (min, max) => `امروز از ${min}° تا ${max}°`,
  monthDelta: (signed, month) => `${signed}° نسبت به میانگین ${month}، 1991–2000`,
  observedNow: "مشاهده همین حالا",
  currentParameters: "پارامترهای فعلی",
  humidity: "رطوبت",
  dewPoint: "نقطه شبنم",
  pressure: "فشار سطح دریا",
  wind: "باد",
  gust: (n) => `تندباد ${n}`,
  precipitation: "بارش",
  cloudCover: "پوشش ابر",
  visibility: "دید",
  uvIndex: "شاخص فرابنفش",
  vpd: "کسری فشار بخار",
  et0: "تبخیر-تعرق مرجع ET₀",
  cape: "انرژی همرفتی",
  radiation: "تابش موج کوتاه",
  column: "ستون",
  airQuality: "کیفیت هوا",
  europeanIndex: (us) => `شاخص اروپایی · آمریکا ${us}`,
  ozone: "ازون",
  no2: "نیتروژن دی‌اکسید",
  so2: "گوگرد دی‌اکسید",
  co: "کربن مونوکسید",
  dust: "گرد و غبار",
  aod: "عمق نوری هواویز",
  fig1: "شکل ۱",
  next24: "۲۴ ساعت آینده",
  temperature: "دما",
  fig2: "شکل ۲",
  sevenDays: "هفت روز",
  high: "بیشینه",
  low: "کمینه",
  rainLine: (mm, pct) => `باران ${mm} mm · ${pct}%`,
  windLine: (wind, uv, et) => `باد ${wind} · فرابنفش ${uv} · ET₀ ${et}`,
  fig3: "شکل ۳",
  climateOutlook: "چشم‌انداز اقلیم",
  ensembleHint: "میانگین بدون وزن سه مدل HighResMIP",
  climateError: "سری مدل اقلیمی برای این نقطه بار نشد.",
  annualTempChange: "تغییر دمای سالانه",
  annualRange: (from, fromLabel, to, toLabel) => `${from}° در ${fromLabel} تا ${to}° در ${toLabel}`,
  annualPrecipChange: "تغییر بارش سالانه",
  precipRange: (from, to) => `${from} تا ${to} mm`,
  monthlyTemp: "میانگین دمای ماهانه",
  baselineYears: "1991–2000",
  futureYears: "2041–2050",
  spreadHint: (spread) => `نوار مسی پراکندگی سه مدل در 2041–2050 است. میانگین پراکندگی ماهانه ${spread}°C.`,
  monthlyPrecip: "بارش ماهانه",
  model: "مدل",
  deltaT: "تغییر دما",
  futureRain: "باران آینده",
  disclaimer:
    "این‌ها میانگین سلول شبکه مدل هستند، نه مشاهده ایستگاه. HighResMIP تا 2050 جایگزین سناریوهای CMIP6 یا گزارش‌های IPCC نیست وقتی تصمیم باید رسمی باشد. خود کاهش در src/lib/outlook.ts است.",
  hydrology: "آبشناسی",
  riverDischarge: "آبدهی رود",
  glofas: "GloFAS · نزدیک‌ترین آبراه",
  negligible: "نزدیک‌ترین آبراه این هفته ناچیز است.",
  record: "شناسنامه",
  aboutTitle: "درباره این برگه",
  aboutBody:
    "ClimaScope پیش‌بینی، ستون هوا، آبدهی GloFAS و مقایسه دهه HighResMIP را روی یک برگه نگه می‌دارد. پروژه دیگر می‌تواند همین مجموعه را بدون نقشه وارد کند.",
  developerLabel: "سازنده برنامه",
  developerName: "علیرضا فاضلی ثانی",
  email: "ایمیل",
  github: "گیت‌هاب",
  aboutHint:
    "منابع: رابط‌های پیش‌بینی، کیفیت هوا، اقلیم و سیل Open-Meteo؛ global-warming.org برای CO₂، متان، N₂O، ناهنجاری GISS و یخ دریا؛ نقشه پایه Esri. نسخه 1.2.1.",
  chartNow: "اکنون",
  chartAhead: "+24 h",
  chartPrecipNote: "°C · میله‌ها بارش هستند",
  chartHour: "دما و بارش در ۲۴ ساعت آینده",
  chartClimate: "میانگین دمای ماهانه، دوره پایه و مجموعه آینده",
  chartPrecip: "بارش ماهانه، دوره پایه و مجموعه آینده",
  chartAqi: "شاخص اروپایی کیفیت هوا",
  chartRiver: "آبدهی رود در هفت روز",
  chartWeek: "بازه دمای هفت روز",
  methodTitle: "مجموعه مدل دقیقاً چه حساب می‌کند",
  methodLead:
    "ClimaScope یک برگه ایستگاه است که به یک کاهش قابل استفاده مجدد از HighResMIP وصل شده. برای هر مختصات، دو دهه خروجی روزانه مدل را به میانگین ماهانه مجموعه تبدیل می‌کند، پراکندگی بین مدل‌ها را نگه می‌دارد، و مشاهده امروز را کنار ماه پایه می‌گذارد. همین کاهش بدون این رابط هم اجرا می‌شود.",
  baseline: "پایه",
  future: "آینده",
  futureSpan: "اجراها در 2050 تمام می‌شوند.",
  between: "تا",
  models: "مدل‌ها",
  temperatureDef: "میانگین روزانه، میانگین‌گیری داخل هر ماه و هر مدل، سپس میانگین بدون وزن سه مدل.",
  precipDef: "جمع روزانه داخل هر سال، سپس میانگین سال‌های آن دهه. میله‌های ماهانه همان تعداد سال را به کار می‌برند.",
  spread: "پراکندگی",
  spreadDef: "برای هر ماه آینده، بالاترین مدل منهای پایین‌ترین. نوار سایه‌دار همین بازه است، نه فاصله عدم‌قطعیت یک مجموعه بزرگ‌تر CMIP6.",
  thisStation: "این ایستگاه",
  worked: (p) =>
    `میانگین سلول شبکه از ${p.from} تا ${p.to} به اندازه ${p.temp} درجه سلسیوس تغییر می‌کند.${p.anomaly != null ? ` دمای فعلی نسبت به پایه ${p.month} برابر ${p.anomaly} درجه سلسیوس است.` : ""} میانگین پراکندگی ماهانه آینده ${p.spread} درجه سلسیوس است.${p.precip != null ? ` بارش سالانه ${p.precip} درصد تغییر می‌کند.` : ""}`,
  methodLimit:
    "این‌ها میانگین سلول شبکه مدل هستند، نه مشاهده ایستگاه، و وقتی تصمیم باید رسمی باشد جایگزین سناریوهای CMIP6 یا گزارش‌های IPCC نیستند. یک نمونه آماده در examples/monthly-ensemble.ts است. آزمون‌های test/outlook.test.ts میانگین ماهانه، روزهای گم‌شده نادیده گرفته‌شده، و اختلاف دهه را قفل می‌کنند.",
}

export const COPY: Record<Lang, Copy> = { en, fa }
