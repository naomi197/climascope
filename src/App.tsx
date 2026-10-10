import { useEffect, useMemo, useState } from "react"
import { Geolocation } from "@capacitor/geolocation"
import { AqiGauge, ClimateLines, DischargeLine, HourRibbon, PrecipBars, Sparkline, WeekChart } from "./components/Figures.tsx"
import { MethodNote } from "./components/MethodNote.tsx"
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
  utcStamp,
  uvLabel,
  weatherText,
  weekdayIso,
  setActiveLang,
  windDir,
} from "./lib/format.ts"
import { COPY, localizePlace, type Lang } from "./lib/copy.ts"
import { stationOutlook } from "./lib/outlook.ts"

const DEFAULT_PLACE: Place = PRESETS[0]
const REFERENCE = PRESETS.slice(0, 5)

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" fill="none" stroke="#d6e6f2" strokeWidth="1" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#d6e6f2" strokeWidth="1.1" />
      <path d="M24 8v32M10 24h28" fill="none" stroke="#d6e6f2" strokeWidth="0.8" />
      <path d="M14 30c4-7 7-5 10-9 3-4 6-2 10 1" fill="none" stroke="#5ec8e6" strokeWidth="1.4" />
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
  const [desk, setDesk] = useState<"briefing" | "method">("briefing")
  const [lang, setLang] = useState<Lang>("en")
  setActiveLang(lang)
  const t = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr"
  }, [lang])

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
      openPlace({ name: "Selected point", latitude, longitude })
    }
  }

  async function locateMe() {
    try {
      const permission = await Geolocation.requestPermissions()
      const granted = permission.location === "granted" || permission.coarseLocation === "granted"
      if (!granted && permission.location !== "prompt") {
        setNotice(COPY[lang].locationDenied)
        return
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 })
      await chooseMap(position.coords.latitude, position.coords.longitude)
      setNotice(null)
    } catch {
      setNotice(COPY[lang].locationUnavailable)
    }
  }

  function retry() {
    setWeather(null)
    setAir(null)
    setFlood(null)
    setClimate(null)
    setWxState("loading")
    setClimateState("loading")
    setReload((value) => value + 1)
  }

  const shown = localizePlace(place, lang)
  const hours = useMemo(() => (weather ? nextHours(weather) : []), [weather])
  const clock = weather ? localClock(weather.timezone, new Date(now)) : ""
  const shownResults = query.trim().length < 2 ? [] : results
  const monthIndex = weather ? Number(weather.current.time.slice(5, 7)) - 1 : 0
  const observedTemperature = weather?.current.temperature_2m
  const outlook = useMemo(
    () => (climate ? stationOutlook(climate, monthIndex, observedTemperature) : null),
    [climate, monthIndex, observedTemperature],
  )
  const airInfo = air ? aqiTone(air.european_aqi) : null
  const iceWhen = globals
    ? labelYearMonth(Number(globals.ice.when.slice(0, 4)), Number(globals.ice.when.slice(4, 6)))
    : ""
  const ch4When = globals ? labelYearMonth(parseDecimalMonth(globals.methane.when).year, parseDecimalMonth(globals.methane.when).month) : ""
  const n2oWhen = globals ? labelYearMonth(parseDecimalMonth(globals.nitrous.when).year, parseDecimalMonth(globals.nitrous.when).month) : ""

  return (
    <div className="folio" lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
      <header className="mast">
        <div className="mast-brand">
          <Mark />
          <div>
            <p className="running">{t.running}</p>
            <h1>ClimaScope</h1>
          </div>
        </div>
        <div className="mast-side">
          <div className="lang-switch" role="group" aria-label={t.language}>
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "fa"} onClick={() => setLang("fa")}>
              فا
            </button>
          </div>
          <p>{utcStamp(new Date(now))}</p>
          <p>{t.sources}</p>
        </div>
      </header>
      <p className="deck">{t.deck}</p>

      <div className="pulse-scroll">
      <section className="pulse" aria-label={t.globals}>
        {globalState === "error" && <p className="inline-error">{t.globalsError}</p>}
        {globalState === "loading" &&
          Array.from({ length: 5 }, (_, index) => <div key={index} className="pulse-card skeleton" />)}
        {globals && (
          <>
            <PulseCard kicker={t.co2} value={fmt(globals.co2.value, 2)} unit={t.ppmTrend} note={t.cycle(fmt(globals.co2.cycle, 1), labelIsoDate(globals.co2.when))} series={globals.co2.series} color="#d4532b" />
            <PulseCard kicker={t.methane} value={fmt(globals.methane.value, 1)} unit={t.ppbTrend} note={ch4When} series={globals.methane.series} color="#b7791f" />
            <PulseCard kicker={t.n2o} value={fmt(globals.nitrous.value, 2)} unit={t.ppbTrend} note={n2oWhen} series={globals.nitrous.series} color="#1a6aa8" />
            <PulseCard kicker={t.anomaly} value={fmtSigned(globals.temperature.value, 2)} unit={t.landOcean} note={labelDecimalYear(globals.temperature.when)} series={globals.temperature.series} color="#c0392b" />
            <PulseCard kicker={t.seaIce} value={fmtSigned(globals.ice.anomaly, 2)} unit={t.iceUnit} note={t.iceNote(fmt(globals.ice.extent, 2), iceWhen)} series={globals.ice.series} color="#1a6aa8" />
          </>
        )}
      </section>
      </div>

      <div className="workspace">
        <aside className="finder">
          <div className="search">
            <label htmlFor="place-search">{t.placeOrCoordinates}</label>
            <div className="search-field">
            <div className="search-row">
              <input
                id="place-search"
                value={query}
                placeholder={t.searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              <button type="button" className="locate" onClick={() => void locateMe()}>
                {t.locate}
              </button>
            </div>
            {searching && <p className="hint">{t.searching}</p>}
            {shownResults.length > 0 && (
              <ul className="results">
                {shownResults.map((item) => (
                  <li key={`${item.latitude}-${item.longitude}-${item.name}`}>
                    <button type="button" onClick={() => openPlace(item)}>
                      <strong>{item.name}</strong>
                      <span>{[item.admin, item.country].filter(Boolean).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
          <div className="index" aria-label={t.referenceStations}>
            {REFERENCE.map((item) => (
              <button
                key={item.name}
                type="button"
                className={item.name === place.name ? "chip active" : "chip"}
                onClick={() => openPlace(item)}
              >
                {localizePlace(item, lang).name}
              </button>
            ))}
          </div>
          <div className="map-plate">
            <ObserveMap lat={place.latitude} lon={place.longitude} onPick={(lat, lon) => void chooseMap(lat, lon)} />
            <p className="map-caption">{t.mapCaption}</p>
          </div>
          {notice && <p className="inline-error">{notice}</p>}
        </aside>

        <main className="board">
          <section className="place-head">
            <div>
              <p className="kicker">{t.virtualStation}</p>
              <h2>{shown.name}</h2>
              <p className="sub">{[shown.admin, shown.country].filter(Boolean).join(lang === "fa" ? "، " : ", ")}</p>
              <div className="desk-switch" role="tablist" aria-label={t.desk}>
                <button type="button" role="tab" aria-selected={desk === "briefing"} onClick={() => setDesk("briefing")}>
                  {t.briefing}
                </button>
                <button type="button" role="tab" aria-selected={desk === "method"} onClick={() => setDesk("method")}>
                  {t.method}
                </button>
              </div>
            </div>
            <div className="place-meta">
              <span>{coordPair(place.latitude, place.longitude)}</span>
              {weather && (
                <>
                  <span>{t.elevation(fmt(weather.elevation, 0))}</span>
                  <span>{clock || weather.timezone}</span>
                </>
              )}
            </div>
          </section>

          {desk === "method" && <MethodNote outlook={outlook} t={t} />}

          {desk === "briefing" && wxState === "error" && (
            <section className="sheet error-sheet">
              <h3>{t.loadErrorTitle}</h3>
              <p className="prose">{t.loadErrorBody}</p>
              <button type="button" className="retry" onClick={retry}>
                {t.tryAgain}
              </button>
            </section>
          )}

          {desk === "briefing" && wxState === "loading" && (
            <section className="sheet" aria-label={t.loading}>
              <div className="skeleton hero-skeleton" />
              <div className="metric-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="skeleton metric-skeleton" />
                ))}
              </div>
            </section>
          )}

          {desk === "briefing" && weather && wxState === "ready" && (
            <>
              <section className="sheet hero">
                <div>
                  <p className="kicker">{weather.current.is_day ? t.day : t.night} · {weather.timezoneAbbreviation}</p>
                  <p className="temp">
                    {fmt(weather.current.temperature_2m, 1)}
                    <span>°C</span>
                  </p>
                  <p className="condition">{weatherText(weather.current.weather_code)}</p>
                </div>
                <div className="hero-side">
                  <p>{t.feelsLike(fmt(weather.current.apparent_temperature, 1))}</p>
                  <p>
                    {t.todayRange(fmt(weather.daily.temperature_2m_min[0], 0), fmt(weather.daily.temperature_2m_max[0], 0))}
                  </p>
                  {outlook?.monthAnomaly != null && (
                    <p className={outlook.monthAnomaly >= 0 ? "delta hot" : "delta cold"}>
                      {t.monthDelta(fmtSigned(outlook.monthAnomaly, 1), monthName(monthIndex))}
                    </p>
                  )}
                  <div className="scale" aria-hidden="true">
                    <i style={{ left: `${scalePos(weather.daily.temperature_2m_min[0], weather.daily.temperature_2m_max[0], weather.current.temperature_2m)}%` }} />
                  </div>
                </div>
              </section>

              <p className="observed-label">{t.observedNow}</p>
              <section className="metric-grid" aria-label={t.currentParameters}>
                <Metric label={t.humidity} value={fmt(weather.current.relative_humidity_2m, 0)} unit="%" />
                <Metric label={t.dewPoint} value={fmt(weather.current.dew_point_2m, 1)} unit="°C" />
                <Metric label={t.pressure} value={fmt(weather.current.pressure_msl, 0)} unit="hPa" />
                <Metric label={t.wind} value={fmt(weather.current.wind_speed_10m, 1)} unit={`km/h ${windDir(weather.current.wind_direction_10m)}`} hint={t.gust(fmt(weather.current.wind_gusts_10m, 0))} />
                <Metric label={t.precipitation} value={fmt(weather.current.precipitation, 1)} unit="mm" />
                <Metric label={t.cloudCover} value={fmt(weather.current.cloud_cover, 0)} unit="%" />
                <Metric label={t.visibility} value={fmt(weather.current.visibility / 1000, 1)} unit="km" />
                <Metric label={t.uvIndex} value={fmt(weather.current.uv_index, 1)} unit={uvLabel(weather.current.uv_index)} />
                <Metric label={t.vpd} value={fmt(weather.current.vapour_pressure_deficit, 2)} unit="kPa" />
                <Metric label={t.et0} value={fmt(weather.current.et0_fao_evapotranspiration, 2)} unit="mm" />
                <Metric label={t.cape} value={fmt(weather.current.cape, 0)} unit="J/kg" />
                <Metric label={t.radiation} value={fmt(weather.current.shortwave_radiation, 0)} unit="W/m²" />
              </section>

              {air && airInfo && (
                <section className="sheet">
                  <div className="figure-head">
                    <div>
                      <p className="figure-id">{t.column}</p>
                      <h3>{t.airQuality}</h3>
                    </div>
                    <span className={`pill ${airInfo.tone}`}>{airInfo.label}</span>
                  </div>
                  <div className="air-layout">
                    <div className="gauge-wrap">
                      <AqiGauge value={air.european_aqi} label={t.chartAqi} />
                      <p className="gauge-value">{fmt(air.european_aqi, 0)}</p>
                      <p className="hint">{t.europeanIndex(fmt(air.us_aqi, 0))}</p>
                    </div>
                    <div className="metric-grid compact">
                      <Metric label="PM2.5" value={fmt(air.pm2_5, 1)} unit="µg/m³" />
                      <Metric label="PM10" value={fmt(air.pm10, 1)} unit="µg/m³" />
                      <Metric label={t.ozone} value={fmt(air.ozone, 1)} unit="µg/m³" />
                      <Metric label={t.no2} value={fmt(air.nitrogen_dioxide, 1)} unit="µg/m³" />
                      <Metric label={t.so2} value={fmt(air.sulphur_dioxide, 1)} unit="µg/m³" />
                      <Metric label={t.co} value={fmt(air.carbon_monoxide, 0)} unit="µg/m³" />
                      <Metric label={t.dust} value={fmt(air.dust, 1)} unit="µg/m³" />
                      <Metric label={t.aod} value={fmt(air.aerosol_optical_depth, 2)} unit="AOD" />
                    </div>
                  </div>
                </section>
              )}

              <section className="sheet">
                <div className="figure-head">
                  <div>
                    <p className="figure-id">{t.fig1}</p>
                    <h3>{t.next24}</h3>
                  </div>
                  <span className="legend">
                    <i className="swatch ice" /> {t.temperature}
                    <i className="swatch copper" /> {t.precipitation}
                  </span>
                </div>
                <HourRibbon
                  temps={hours.map((hour) => hour.temp)}
                  precips={hours.map((hour) => hour.precip)}
                  label={t.chartHour}
                  now={t.chartNow}
                  ahead={t.chartAhead}
                  note={t.chartPrecipNote}
                />
                <div className="hour-axis">
                  {hours.filter((_, index) => index % 4 === 0).map((hour) => (
                    <span key={hour.time}>{hourLabel(hour.time)}</span>
                  ))}
                </div>
              </section>

              <section className="sheet">
                <div className="figure-head">
                  <div>
                    <p className="figure-id">{t.fig2}</p>
                    <h3>{t.sevenDays}</h3>
                  </div>
                  <span className="legend">
                    <i className="swatch copper" /> {t.high}
                    <i className="swatch ice" /> {t.low}
                  </span>
                </div>
                <WeekChart maxes={weather.daily.temperature_2m_max} mins={weather.daily.temperature_2m_min} label={t.chartWeek} />
                <div className="days">
                  {weather.daily.time.map((day, index) => (
                    <article key={day}>
                      <strong>{weekdayIso(day)}</strong>
                      <span>{weatherText(weather.daily.weather_code[index])}</span>
                      <b>
                        {fmt(weather.daily.temperature_2m_max[index], 0)}° / {fmt(weather.daily.temperature_2m_min[index], 0)}°
                      </b>
                      <em>{t.rainLine(fmt(weather.daily.precipitation_sum[index], 1), fmt(weather.daily.precipitation_probability_max[index], 0))}</em>
                      <em>{t.windLine(fmt(weather.daily.wind_speed_10m_max[index], 0), fmt(weather.daily.uv_index_max[index], 0), fmt(weather.daily.et0_fao_evapotranspiration[index], 1))}</em>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {desk === "briefing" && (
            <section className="sheet">
              <div className="figure-head">
                <div>
                  <p className="figure-id">{t.fig3}</p>
                  <h3>{t.climateOutlook}</h3>
                </div>
                <span className="hint">{t.ensembleHint}</span>
              </div>
              {climateState === "loading" && <div className="skeleton climate-skeleton" />}
              {climateState === "error" && <p className="inline-error">{t.climateError}</p>}
              {climate && outlook && climateState === "ready" && (
                <>
                  <div className="delta-row">
                    <article>
                      <p>{t.annualTempChange}</p>
                      <strong className={outlook.annualTempDelta >= 0 ? "hot" : "cold"}>{fmtSigned(outlook.annualTempDelta, 2)}°C</strong>
                      <span>
                        {t.annualRange(fmt(climate.baseline.annualTemp, 1), outlook.baselineLabel, fmt(climate.future.annualTemp, 1), outlook.futureLabel)}
                      </span>
                    </article>
                    <article>
                      <p>{t.annualPrecipChange}</p>
                      <strong>{fmtSigned(outlook.annualPrecipDeltaPct, 1)}%</strong>
                      <span>
                        {t.precipRange(fmt(climate.baseline.annualPrecip, 0), fmt(climate.future.annualPrecip, 0))}
                      </span>
                    </article>
                  </div>
                  <div className="figure-head tight">
                    <h3>{t.monthlyTemp}</h3>
                    <span className="legend">
                      <i className="swatch ice" /> {t.baselineYears}
                      <i className="swatch copper" /> {t.futureYears}
                    </span>
                  </div>
                  <ClimateLines baseline={climate.baseline.temp} future={climate.future.temp} low={climate.future.tempLow} high={climate.future.tempHigh} label={t.chartClimate} />
                  <p className="hint">{t.spreadHint(fmt(outlook.futureSpread, 2))}</p>
                  <div className="figure-head tight">
                    <h3>{t.monthlyPrecip}</h3>
                  </div>
                  <PrecipBars baseline={climate.baseline.precip} future={climate.future.precip} label={t.chartPrecip} />
                  <table className="model-table">
                    <thead>
                      <tr>
                        <th>{t.model}</th>
                        <th>{t.baselineYears}</th>
                        <th>{t.futureYears}</th>
                        <th>{t.deltaT}</th>
                        <th>{t.futureRain}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outlook.models.map((model) => (
                        <tr key={model.label}>
                          <td>{model.label}</td>
                          <td data-label={t.baselineYears}>{fmt(model.baselineTemp, 2)}°</td>
                          <td data-label={t.futureYears}>{fmt(model.futureTemp, 2)}°</td>
                          <td data-label={t.deltaT}>{fmtSigned(model.tempDelta, 2)}°</td>
                          <td data-label={t.futureRain}>{fmt(model.futurePrecip, 0)} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="disclaimer">{t.disclaimer}</p>
                </>
              )}
            </section>
          )}

          {desk === "briefing" && flood && (
            <section className="sheet">
              <div className="figure-head">
                <div>
                  <p className="figure-id">{t.hydrology}</p>
                  <h3>{t.riverDischarge}</h3>
                </div>
                <span className="hint">{t.glofas}</span>
              </div>
              {Math.max(...flood.river_discharge.map((value) => (value != null && Number.isFinite(value) ? value : 0))) < 0.05 ? (
                <p className="prose">{t.negligible}</p>
              ) : (
                <DischargeLine values={flood.river_discharge} label={t.chartRiver} />
              )}
            </section>
          )}

          <section className="sheet about">
            <p className="figure-id">{t.record}</p>
            <h3>{t.aboutTitle}</h3>
            <p className="prose">{t.aboutBody}</p>
            <div className="developer">
              <p className="developer-name">
                <span>{t.developerLabel}</span>
                {t.developerName}
              </p>
              <a href={`mailto:${DEVELOPER_EMAIL}`}>
                <span>{t.email}</span>
                {DEVELOPER_EMAIL}
              </a>
              <a href="https://github.com/naomi197" target="_blank" rel="noreferrer">
                <span>{t.github}</span>
                github.com/naomi197
              </a>
            </div>
            <p className="hint">{t.aboutHint}</p>
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
