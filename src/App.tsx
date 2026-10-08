import { useEffect, useMemo, useState } from "react"
import { Geolocation } from "@capacitor/geolocation"
import { AqiGauge, ClimateLines, HourRibbon, PrecipBars, Sparkline, WeekChart } from "./components/Figures.tsx"
import { ObserveMap } from "./components/ObserveMap.tsx"
import {
  loadAir,
  loadClimate,
  loadFlood,
  loadGlobals,
  loadWeather,
  PRESETS,
  reversePlace,
  searchPlaces,
  type AirCurrent,
  type ClimateCompare,
  type FloodSeries,
  type GlobalIndicators,
  type Place,
  type WeatherBundle,
} from "./lib/api.ts"
import {
  aqiTone,
  coordPair,
  DEVELOPER_EMAIL,
  fmt,
  fmtSigned,
  hourLabel,
  labelDecimalYear,
  labelIsoDate,
  labelYearMonth,
  localClock,
  monthName,
  parseDecimalMonth,
  uvLabel,
  weatherFa,
  weekdayIso,
  windDir,
} from "./lib/format.ts"

const DEFAULT_PLACE: Place = PRESETS[0]

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#102832" stroke="#2ee6c7" strokeWidth="1.5" />
      <path d="M8 27c4-6 8-4 12-8s8-2 12 2 8 1 8-3" fill="none" stroke="#e8a06a" strokeWidth="1.8" />
      <ellipse cx="24" cy="24" rx="10" ry="20" fill="none" stroke="#8ecbff" strokeWidth="1.2" />
      <path d="M6 24h36M24 4c6 6 6 34 0 40M24 4c-6 6-6 34 0 40" fill="none" stroke="#2ee6c7" strokeWidth="1.1" opacity=".8" />
    </svg>
  )
}

function nextHours(weather: WeatherBundle) {
  const start = weather.hourly.time.findIndex((stamp) => stamp >= weather.current.time)
  const index = start < 0 ? 0 : start
  return weather.hourly.time.slice(index, index + 24).map((time, offset) => ({
    time,
    temp: weather.hourly.temperature_2m[index + offset],
    precip: weather.hourly.precipitation[index + offset],
  }))
}

export default function App() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [weather, setWeather] = useState<WeatherBundle | null>(null)
  const [air, setAir] = useState<AirCurrent | null>(null)
  const [flood, setFlood] = useState<FloodSeries | null>(null)
  const [climate, setClimate] = useState<ClimateCompare | null>(null)
  const [globals, setGlobals] = useState<GlobalIndicators | null>(null)
  const [wxState, setWxState] = useState<"loading" | "ready" | "error">("loading")
  const [climateState, setClimateState] = useState<"loading" | "ready" | "error">("loading")
  const [globalState, setGlobalState] = useState<"loading" | "ready" | "error">("loading")
  const [notice, setNotice] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadGlobals(controller.signal)
      .then((data) => {
        setGlobals(data)
        setGlobalState("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setGlobalState("error")
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([loadWeather(place, controller.signal), loadAir(place, controller.signal), loadFlood(place, controller.signal)])
      .then(([nextWeather, nextAir, nextFlood]) => {
        setWeather(nextWeather)
        setAir(nextAir)
        setFlood(nextFlood)
        setWxState("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setWxState("error")
      })
    return () => controller.abort()
  }, [place, reload])

  useEffect(() => {
    const controller = new AbortController()
    loadClimate(place, controller.signal)
      .then((data) => {
        setClimate(data)
        setClimateState("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setClimateState("error")
      })
    return () => controller.abort()
  }, [place, reload])

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching(true)
      searchPlaces(text, controller.signal)
        .then(setResults)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return
          setResults([])
        })
        .finally(() => setSearching(false))
    }, 280)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  function openPlace(next: Place) {
    setQuery("")
    setResults([])
    setWeather(null)
    setAir(null)
    setFlood(null)
    setClimate(null)
    setWxState("loading")
    setClimateState("loading")
    setNotice(null)
    setPlace(next)
  }

  async function chooseMap(latitude: number, longitude: number) {
    try {
      openPlace(await reversePlace(latitude, longitude))
    } catch {
      openPlace({ name: "نقطه انتخاب‌شده", latitude, longitude })
    }
  }

  async function locateMe() {
    try {
      const permission = await Geolocation.requestPermissions()
      const granted = permission.location === "granted" || permission.coarseLocation === "granted"
      if (!granted && permission.location !== "prompt") {
        setNotice("دسترسی به موقعیت مکانی داده نشد.")
        return
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 })
      await chooseMap(position.coords.latitude, position.coords.longitude)
      setNotice(null)
    } catch {
      setNotice("موقعیت فعلی در دسترس نیست. نام شهر یا مختصات را وارد کنید.")
    }
  }

  const hours = useMemo(() => (weather ? nextHours(weather) : []), [weather])
  const clock = weather ? localClock(weather.timezone, new Date(now)) : ""
  const shownResults = query.trim().length < 2 ? [] : results
  const monthIndex = weather ? Number(weather.current.time.slice(5, 7)) - 1 : 0
  const anomaly =
    climate && weather ? weather.current.temperature_2m - climate.baseline.temp[monthIndex] : null
  const tempDelta = climate ? climate.future.annualTemp - climate.baseline.annualTemp : null
  const precipDelta =
    climate && climate.baseline.annualPrecip
      ? ((climate.future.annualPrecip - climate.baseline.annualPrecip) / climate.baseline.annualPrecip) * 100
      : null
  const airInfo = air ? aqiTone(air.european_aqi) : null
  const iceWhen = globals
    ? labelYearMonth(Number(globals.ice.when.slice(0, 4)), Number(globals.ice.when.slice(4, 6)))
    : ""
  const ch4When = globals ? labelYearMonth(parseDecimalMonth(globals.methane.when).year, parseDecimalMonth(globals.methane.when).month) : ""
  const n2oWhen = globals ? labelYearMonth(parseDecimalMonth(globals.nitrous.when).year, parseDecimalMonth(globals.nitrous.when).month) : ""

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <Mark />
          <div>
            <p className="eyebrow">رصدخانه همراه تغییر اقلیم</p>
            <h1>اقلیم‌نما</h1>
          </div>
        </div>
        <p className="lede">پارامترهای جوی، کیفیت هوا، آب‌شناسی و چشم‌انداز مدل‌های اقلیمی برای هر نقطه از زمین.</p>
      </header>

      <section className="pulse" aria-label="شاخص‌های جهانی">
        {globalState === "error" && <p className="inline-error">شاخص‌های جهانی فعلاً در دسترس نیستند.</p>}
        {globalState === "loading" &&
          Array.from({ length: 5 }, (_, index) => <div key={index} className="pulse-card skeleton" />)}
        {globals && (
          <>
            <PulseCard
              kicker="دی‌اکسید کربن"
              value={fmt(globals.co2.value, 2)}
              unit="ppm روند"
              note={`چرخه ${fmt(globals.co2.cycle, 1)} · ${labelIsoDate(globals.co2.when)}`}
              series={globals.co2.series}
              color="#e8a06a"
            />
            <PulseCard
              kicker="متان"
              value={fmt(globals.methane.value, 1)}
              unit="ppb روند"
              note={ch4When}
              series={globals.methane.series}
              color="#e7c56a"
            />
            <PulseCard
              kicker="اکسید نیتروژن"
              value={fmt(globals.nitrous.value, 2)}
              unit="ppb روند"
              note={n2oWhen}
              series={globals.nitrous.series}
              color="#8ecbff"
            />
            <PulseCard
              kicker="ناهنجاری دمای جهانی"
              value={fmtSigned(globals.temperature.value, 2)}
              unit="°C خشکی-اقیانوس"
              note={labelDecimalYear(globals.temperature.when)}
              series={globals.temperature.series}
              color="#ff8f78"
            />
            <PulseCard
              kicker="یخ دریا"
              value={fmtSigned(globals.ice.anomaly, 2)}
              unit="میلیون km² ناهنجاری"
              note={`${fmt(globals.ice.extent, 2)} گستره · ${iceWhen}`}
              series={globals.ice.series}
              color="#8ecbff"
            />
          </>
        )}
      </section>

      <div className="workspace">
        <aside className="finder">
          <div className="search">
            <label htmlFor="place-search">مکان یا مختصات</label>
            <div className="search-row">
              <input
                id="place-search"
                value={query}
                placeholder="تهران، داکا، یا 35.69, 51.42"
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              <button type="button" className="ghost" onClick={() => void locateMe()}>
                مکان من
              </button>
            </div>
            {searching && <p className="hint">در حال جستجو…</p>}
            {shownResults.length > 0 && (
              <ul className="results">
                {shownResults.map((item) => (
                  <li key={`${item.latitude}-${item.longitude}-${item.name}`}>
                    <button
                      type="button"
                      onClick={() => openPlace(item)}
                    >
                      <strong>{item.name}</strong>
                      <span>{[item.admin, item.country].filter(Boolean).join("، ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="chips" aria-label="مکان‌های آماده">
            {PRESETS.map((item) => (
              <button
                key={item.name}
                type="button"
                className={item.name === place.name ? "chip active" : "chip"}
                onClick={() => openPlace(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="map-wrap">
            <ObserveMap lat={place.latitude} lon={place.longitude} onPick={(lat, lon) => void chooseMap(lat, lon)} />
            <p className="map-caption">لمس نقشه، همان مختصات را باز می‌کند.</p>
          </div>
          {notice && <p className="inline-error">{notice}</p>}
        </aside>

        <main className="board">
          <section className="place-head">
            <div>
              <p className="eyebrow">ایستگاه مجازی</p>
              <h2>{place.name}</h2>
              <p className="sub">{[place.admin, place.country].filter(Boolean).join("، ")}</p>
            </div>
            <div className="place-meta">
              <span>{coordPair(place.latitude, place.longitude)}</span>
              {weather && (
                <>
                  <span>ارتفاع {fmt(weather.elevation, 0)} متر</span>
                  <span>{clock || weather.timezone}</span>
                </>
              )}
            </div>
          </section>

          {wxState === "error" && (
            <section className="panel error-panel">
              <h3>داده این نقطه دریافت نشد</h3>
              <p>اتصال را بررسی کنید و دوباره تلاش کنید.</p>
              <button
                type="button"
                onClick={() => {
                  setWeather(null)
                  setAir(null)
                  setFlood(null)
                  setClimate(null)
                  setWxState("loading")
                  setClimateState("loading")
                  setReload((value) => value + 1)
                }}
              >
                تلاش دوباره
              </button>
            </section>
          )}

          {wxState === "loading" && (
            <section className="panel skeleton-block" aria-label="در حال دریافت داده">
              <div className="skeleton hero-skeleton" />
              <div className="metric-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="skeleton metric-skeleton" />
                ))}
              </div>
            </section>
          )}

          {weather && wxState === "ready" && (
            <>
              <section className="hero panel">
                <div>
                  <p className="eyebrow">{weather.current.is_day ? "روشن" : "شب"} · {weather.timezoneAbbreviation}</p>
                  <p className="temp">
                    {fmt(weather.current.temperature_2m, 1)}
                    <span>°C</span>
                  </p>
                  <p className="condition">{weatherFa(weather.current.weather_code)}</p>
                </div>
                <div className="hero-side">
                  <p>احساس دما {fmt(weather.current.apparent_temperature, 1)}°</p>
                  <p>
                    امروز {fmt(weather.daily.temperature_2m_min[0], 0)}° تا {fmt(weather.daily.temperature_2m_max[0], 0)}°
                  </p>
                  {anomaly != null && Number.isFinite(anomaly) && (
                    <p className={anomaly >= 0 ? "delta hot" : "delta cold"}>
                      {fmtSigned(anomaly, 1)}° نسبت به میانگین {monthName(monthIndex)} در ۱۹۹۱–۲۰۰۰
                    </p>
                  )}
                  <div className="scale" aria-hidden="true">
                    <i style={{ left: `${scalePos(weather.daily.temperature_2m_min[0], weather.daily.temperature_2m_max[0], weather.current.temperature_2m)}%` }} />
                  </div>
                </div>
              </section>

              <section className="metric-grid" aria-label="پارامترهای لحظه‌ای">
                <Metric label="رطوبت" value={fmt(weather.current.relative_humidity_2m, 0)} unit="٪" />
                <Metric label="نقطه شبنم" value={fmt(weather.current.dew_point_2m, 1)} unit="°C" />
                <Metric label="فشار سطح دریا" value={fmt(weather.current.pressure_msl, 0)} unit="hPa" />
                <Metric
                  label="باد"
                  value={fmt(weather.current.wind_speed_10m, 1)}
                  unit={`km/h ${windDir(weather.current.wind_direction_10m)}`}
                  hint={`جهش ${fmt(weather.current.wind_gusts_10m, 0)}`}
                />
                <Metric label="بارش" value={fmt(weather.current.precipitation, 1)} unit="mm" />
                <Metric label="ابرناکی" value={fmt(weather.current.cloud_cover, 0)} unit="٪" />
                <Metric label="دید" value={fmt(weather.current.visibility / 1000, 1)} unit="km" />
                <Metric label="شاخص فرابنفش" value={fmt(weather.current.uv_index, 1)} unit={uvLabel(weather.current.uv_index)} />
                <Metric label="کمبود فشار بخار" value={fmt(weather.current.vapour_pressure_deficit, 2)} unit="kPa" />
                <Metric label="تبخیر-تعرق مرجع" value={fmt(weather.current.et0_fao_evapotranspiration, 2)} unit="mm" />
                <Metric label="انرژی همرفتی" value={fmt(weather.current.cape, 0)} unit="J/kg" />
                <Metric label="تابش موج کوتاه" value={fmt(weather.current.shortwave_radiation, 0)} unit="W/m²" />
              </section>

              {air && airInfo && (
                <section className="panel air">
                  <div className="section-title">
                    <h3>کیفیت هوا</h3>
                    <span className={`pill ${airInfo.tone}`}>{airInfo.label}</span>
                  </div>
                  <div className="air-layout">
                    <div className="gauge-wrap">
                      <AqiGauge value={air.european_aqi} />
                      <p className="gauge-value">{fmt(air.european_aqi, 0)}</p>
                      <p className="hint">شاخص اروپایی · آمریکایی {fmt(air.us_aqi, 0)}</p>
                    </div>
                    <div className="metric-grid compact">
                      <Metric label="PM2.5" value={fmt(air.pm2_5, 1)} unit="µg/m³" />
                      <Metric label="PM10" value={fmt(air.pm10, 1)} unit="µg/m³" />
                      <Metric label="ازون" value={fmt(air.ozone, 1)} unit="µg/m³" />
                      <Metric label="دی‌اکسید نیتروژن" value={fmt(air.nitrogen_dioxide, 1)} unit="µg/m³" />
                      <Metric label="دی‌اکسید گوگرد" value={fmt(air.sulphur_dioxide, 1)} unit="µg/m³" />
                      <Metric label="مونوکسید کربن" value={fmt(air.carbon_monoxide, 0)} unit="µg/m³" />
                      <Metric label="گردوغبار" value={fmt(air.dust, 1)} unit="µg/m³" />
                      <Metric label="عمق نوری هواویز" value={fmt(air.aerosol_optical_depth, 2)} unit="AOD" />
                    </div>
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="section-title">
                  <h3>۲۴ ساعت آینده</h3>
                  <span className="hint">خط دما · میله بارش</span>
                </div>
                <HourRibbon temps={hours.map((hour) => hour.temp)} precips={hours.map((hour) => hour.precip)} />
                <div className="hour-axis">
                  {hours.filter((_, index) => index % 4 === 0).map((hour) => (
                    <span key={hour.time}>{hourLabel(hour.time)}</span>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="section-title">
                  <h3>هفت روز</h3>
                  <span className="legend">
                    <i className="swatch copper" /> بیشینه
                    <i className="swatch ice" /> کمینه
                  </span>
                </div>
                <WeekChart maxes={weather.daily.temperature_2m_max} mins={weather.daily.temperature_2m_min} />
                <div className="days">
                  {weather.daily.time.map((day, index) => (
                    <article key={day}>
                      <strong>{weekdayIso(day)}</strong>
                      <span>{weatherFa(weather.daily.weather_code[index])}</span>
                      <b>
                        {fmt(weather.daily.temperature_2m_max[index], 0)}° / {fmt(weather.daily.temperature_2m_min[index], 0)}°
                      </b>
                      <em>
                        بارش {fmt(weather.daily.precipitation_sum[index], 1)} mm · احتمال {fmt(weather.daily.precipitation_probability_max[index], 0)}٪
                      </em>
                      <em>
                        باد {fmt(weather.daily.wind_speed_10m_max[index], 0)} · UV {fmt(weather.daily.uv_index_max[index], 0)} · ET₀ {fmt(weather.daily.et0_fao_evapotranspiration[index], 1)}
                      </em>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="panel">
            <div className="section-title">
              <h3>چشم‌انداز اقلیمی</h3>
              <span className="hint">میانگین سه مدل HighResMIP</span>
            </div>
            {climateState === "loading" && <div className="skeleton climate-skeleton" />}
            {climateState === "error" && <p className="inline-error">سری مدل اقلیمی برای این نقطه بارگذاری نشد.</p>}
            {climate && climateState === "ready" && (
              <>
                <div className="delta-row">
                  <article>
                    <p>تغییر دمای سالانه</p>
                    <strong className={tempDelta != null && tempDelta >= 0 ? "hot" : "cold"}>{fmtSigned(tempDelta, 2)}°C</strong>
                    <span>
                      {fmt(climate.baseline.annualTemp, 1)}° در ۱۹۹۱–۲۰۰۰ به {fmt(climate.future.annualTemp, 1)}° در ۲۰۴۱–۲۰۵۰
                    </span>
                  </article>
                  <article>
                    <p>تغییر بارش سالانه</p>
                    <strong>{fmtSigned(precipDelta, 1)}٪</strong>
                    <span>
                      {fmt(climate.baseline.annualPrecip, 0)} به {fmt(climate.future.annualPrecip, 0)} میلی‌متر
                    </span>
                  </article>
                </div>
                <div className="section-title tight">
                  <h3>دمای میانگین ماهانه</h3>
                  <span className="legend">
                    <i className="swatch ice" /> ۱۹۹۱–۲۰۰۰
                    <i className="swatch copper" /> ۲۰۴۱–۲۰۵۰
                  </span>
                </div>
                <ClimateLines
                  baseline={climate.baseline.temp}
                  future={climate.future.temp}
                  low={climate.future.tempLow}
                  high={climate.future.tempHigh}
                />
                <p className="hint">نوار مسی، دامنه سه مدل در دوره آینده است.</p>
                <div className="section-title tight">
                  <h3>بارش ماهانه</h3>
                </div>
                <PrecipBars baseline={climate.baseline.precip} future={climate.future.precip} />
                <div className="models">
                  {climate.future.models.map((model, index) => {
                    const base = climate.baseline.models[index]
                    const delta = model.annualTemp - (base?.annualTemp ?? model.annualTemp)
                    return (
                      <p key={model.label}>
                        <strong>{model.label}</strong>
                        <span>{fmtSigned(delta, 2)}°C دما · بارش آینده {fmt(model.annualPrecip, 0)} mm</span>
                      </p>
                    )
                  })}
                </div>
                <p className="disclaimer">
                  این اعداد میانگین یاخته مدل هستند، نه مشاهده ایستگاهی. مدل‌ها از مجموعه HighResMIP تا سال ۲۰۵۰ هستند و جایگزین سناریوهای CMIP6 یا گزارش IPCC برای تصمیم رسمی نیستند.
                </p>
              </>
            )}
          </section>

          {flood && (
            <section className="panel">
              <div className="section-title">
                <h3>دبی رودخانه</h3>
                <span className="hint">GloFAS · نزدیک‌ترین آبراهه</span>
              </div>
              <div className="days flood">
                {flood.time.map((day, index) => (
                  <article key={day}>
                    <strong>{weekdayIso(day)}</strong>
                    <b>{fmt(flood.river_discharge[index], 2)}</b>
                    <em>m³/s</em>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="panel about">
            <h3>درباره اقلیم‌نما</h3>
            <p>
              ابزار میدانی برای متخصصان تغییر اقلیم: وضعیت لحظه‌ای جو، آلاینده‌ها، تبخیر-تعرق، دبی رودخانه و مقایسه اقلیم مدل بین دو دهه.
            </p>
            <div className="developer">
              <p>سازنده و توسعه‌دهنده</p>
              <a href={`mailto:${DEVELOPER_EMAIL}`}>{DEVELOPER_EMAIL}</a>
            </div>
            <p className="hint">
              منابع: Open-Meteo برای پیش‌بینی، کیفیت هوا، مدل اقلیمی و سیل؛ global-warming.org برای CO₂، متان، N₂O، ناهنجاری GISS و یخ دریا؛ نقشه از OpenStreetMap و CARTO.
            </p>
            <p className="hint">نسخه ۱.۰.۰</p>
          </section>
        </main>
      </div>
    </div>
  )
}

function PulseCard({
  kicker,
  value,
  unit,
  note,
  series,
  color,
}: {
  kicker: string
  value: string
  unit: string
  note: string
  series: number[]
  color: string
}) {
  return (
    <article className="pulse-card">
      <p>{kicker}</p>
      <strong>{value}</strong>
      <span>{unit}</span>
      <Sparkline values={series} color={color} />
      <em>{note}</em>
    </article>
  )
}

function Metric({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{unit}</span>
      {hint && <em>{hint}</em>}
    </article>
  )
}

function scalePos(min: number, max: number, value: number): number {
  const span = max - min || 1
  return Math.min(100, Math.max(0, ((value - min) / span) * 100))
}
