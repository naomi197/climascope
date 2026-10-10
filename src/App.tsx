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
  windDir,
} from "./lib/format.ts"
import { stationOutlook } from "./lib/outlook.ts"

const DEFAULT_PLACE: Place = PRESETS[0]
const REFERENCE = PRESETS.slice(0, 5)

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" fill="none" stroke="#f4efe4" strokeWidth="1" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#f4efe4" strokeWidth="1.1" />
      <path d="M24 8v32M10 24h28" fill="none" stroke="#f4efe4" strokeWidth="0.8" />
      <path d="M14 30c4-7 7-5 10-9 3-4 6-2 10 1" fill="none" stroke="#c47a45" strokeWidth="1.4" />
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
        setNotice("Location permission was denied.")
        return
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 })
      await chooseMap(position.coords.latitude, position.coords.longitude)
      setNotice(null)
    } catch {
      setNotice("Current location is unavailable. Search for a city or enter coordinates.")
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
    <div className="folio">
      <header className="mast">
        <div className="mast-brand">
          <Mark />
          <div>
            <p className="running">Climate observatory · HighResMIP grid means</p>
            <h1>ClimaScope</h1>
          </div>
        </div>
        <div className="mast-side">
          <p>{utcStamp(new Date(now))}</p>
          <p>Open-Meteo · GloFAS · global-warming.org</p>
        </div>
      </header>
      <p className="deck">A station briefing for any point on Earth: the live atmosphere, the air column, river discharge, and a three-model decade comparison.</p>

      <div className="pulse-scroll">
      <section className="pulse" aria-label="Global indicators">
        {globalState === "error" && <p className="inline-error">Global indicators are unavailable right now.</p>}
        {globalState === "loading" &&
          Array.from({ length: 5 }, (_, index) => <div key={index} className="pulse-card skeleton" />)}
        {globals && (
          <>
            <PulseCard kicker="Carbon dioxide" value={fmt(globals.co2.value, 2)} unit="ppm trend" note={`cycle ${fmt(globals.co2.cycle, 1)} · ${labelIsoDate(globals.co2.when)}`} series={globals.co2.series} color="#9a4e24" />
            <PulseCard kicker="Methane" value={fmt(globals.methane.value, 1)} unit="ppb trend" note={ch4When} series={globals.methane.series} color="#8a5a12" />
            <PulseCard kicker="Nitrous oxide" value={fmt(globals.nitrous.value, 2)} unit="ppb trend" note={n2oWhen} series={globals.nitrous.series} color="#1d4e89" />
            <PulseCard kicker="Temperature anomaly" value={fmtSigned(globals.temperature.value, 2)} unit="°C land-ocean" note={labelDecimalYear(globals.temperature.when)} series={globals.temperature.series} color="#8d2f2a" />
            <PulseCard kicker="Sea ice" value={fmtSigned(globals.ice.anomaly, 2)} unit="million km² anomaly" note={`${fmt(globals.ice.extent, 2)} extent · ${iceWhen}`} series={globals.ice.series} color="#1d4e89" />
          </>
        )}
      </section>
      </div>

      <div className="workspace">
        <aside className="finder">
          <div className="search">
            <label htmlFor="place-search">Place or coordinates</label>
            <div className="search-field">
            <div className="search-row">
              <input
                id="place-search"
                value={query}
                placeholder="City, or lat, lon"
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              <button type="button" className="locate" onClick={() => void locateMe()}>
                Locate
              </button>
            </div>
            {searching && <p className="hint">Searching the gazetteer…</p>}
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
          <div className="index" aria-label="Reference stations">
            {REFERENCE.map((item) => (
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
          <div className="map-plate">
            <ObserveMap lat={place.latitude} lon={place.longitude} onPick={(lat, lon) => void chooseMap(lat, lon)} />
            <p className="map-caption">Esri Dark Gray. Tap the chart to open that coordinate.</p>
          </div>
          {notice && <p className="inline-error">{notice}</p>}
        </aside>

        <main className="board">
          <section className="place-head">
            <div>
              <p className="kicker">Virtual station</p>
              <h2>{place.name}</h2>
              <p className="sub">{[place.admin, place.country].filter(Boolean).join(", ")}</p>
              <div className="desk-switch" role="tablist" aria-label="Desk">
                <button type="button" role="tab" aria-selected={desk === "briefing"} onClick={() => setDesk("briefing")}>
                  Briefing
                </button>
                <button type="button" role="tab" aria-selected={desk === "method"} onClick={() => setDesk("method")}>
                  Method
                </button>
              </div>
            </div>
            <div className="place-meta">
              <span>{coordPair(place.latitude, place.longitude)}</span>
              {weather && (
                <>
                  <span>Elevation {fmt(weather.elevation, 0)} m</span>
                  <span>{clock || weather.timezone}</span>
                </>
              )}
            </div>
          </section>

          {desk === "method" && <MethodNote outlook={outlook} />}

          {desk === "briefing" && wxState === "error" && (
            <section className="sheet error-sheet">
              <h3>This location could not be loaded</h3>
              <p className="prose">Check the connection and try again.</p>
              <button type="button" className="retry" onClick={retry}>
                Try again
              </button>
            </section>
          )}

          {desk === "briefing" && wxState === "loading" && (
            <section className="sheet" aria-label="Loading observations">
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
                  <p className="kicker">{weather.current.is_day ? "Day" : "Night"} · {weather.timezoneAbbreviation}</p>
                  <p className="temp">
                    {fmt(weather.current.temperature_2m, 1)}
                    <span>°C</span>
                  </p>
                  <p className="condition">{weatherText(weather.current.weather_code)}</p>
                </div>
                <div className="hero-side">
                  <p>Feels like {fmt(weather.current.apparent_temperature, 1)}°</p>
                  <p>
                    Today {fmt(weather.daily.temperature_2m_min[0], 0)}° to {fmt(weather.daily.temperature_2m_max[0], 0)}°
                  </p>
                  {outlook?.monthAnomaly != null && (
                    <p className={outlook.monthAnomaly >= 0 ? "delta hot" : "delta cold"}>
                      {fmtSigned(outlook.monthAnomaly, 1)}° against the {monthName(monthIndex)} mean, 1991–2000
                    </p>
                  )}
                  <div className="scale" aria-hidden="true">
                    <i style={{ left: `${scalePos(weather.daily.temperature_2m_min[0], weather.daily.temperature_2m_max[0], weather.current.temperature_2m)}%` }} />
                  </div>
                </div>
              </section>

              <p className="observed-label">Observed now</p>
              <section className="metric-grid" aria-label="Current parameters">
                <Metric label="Humidity" value={fmt(weather.current.relative_humidity_2m, 0)} unit="%" />
                <Metric label="Dew point" value={fmt(weather.current.dew_point_2m, 1)} unit="°C" />
                <Metric label="Sea-level pressure" value={fmt(weather.current.pressure_msl, 0)} unit="hPa" />
                <Metric label="Wind" value={fmt(weather.current.wind_speed_10m, 1)} unit={`km/h ${windDir(weather.current.wind_direction_10m)}`} hint={`Gust ${fmt(weather.current.wind_gusts_10m, 0)}`} />
                <Metric label="Precipitation" value={fmt(weather.current.precipitation, 1)} unit="mm" />
                <Metric label="Cloud cover" value={fmt(weather.current.cloud_cover, 0)} unit="%" />
                <Metric label="Visibility" value={fmt(weather.current.visibility / 1000, 1)} unit="km" />
                <Metric label="UV index" value={fmt(weather.current.uv_index, 1)} unit={uvLabel(weather.current.uv_index)} />
                <Metric label="Vapor pressure deficit" value={fmt(weather.current.vapour_pressure_deficit, 2)} unit="kPa" />
                <Metric label="Reference ET₀" value={fmt(weather.current.et0_fao_evapotranspiration, 2)} unit="mm" />
                <Metric label="Convective energy" value={fmt(weather.current.cape, 0)} unit="J/kg" />
                <Metric label="Shortwave radiation" value={fmt(weather.current.shortwave_radiation, 0)} unit="W/m²" />
              </section>

              {air && airInfo && (
                <section className="sheet">
                  <div className="figure-head">
                    <div>
                      <p className="figure-id">Column</p>
                      <h3>Air quality</h3>
                    </div>
                    <span className={`pill ${airInfo.tone}`}>{airInfo.label}</span>
                  </div>
                  <div className="air-layout">
                    <div className="gauge-wrap">
                      <AqiGauge value={air.european_aqi} />
                      <p className="gauge-value">{fmt(air.european_aqi, 0)}</p>
                      <p className="hint">European index · US {fmt(air.us_aqi, 0)}</p>
                    </div>
                    <div className="metric-grid compact">
                      <Metric label="PM2.5" value={fmt(air.pm2_5, 1)} unit="µg/m³" />
                      <Metric label="PM10" value={fmt(air.pm10, 1)} unit="µg/m³" />
                      <Metric label="Ozone" value={fmt(air.ozone, 1)} unit="µg/m³" />
                      <Metric label="Nitrogen dioxide" value={fmt(air.nitrogen_dioxide, 1)} unit="µg/m³" />
                      <Metric label="Sulphur dioxide" value={fmt(air.sulphur_dioxide, 1)} unit="µg/m³" />
                      <Metric label="Carbon monoxide" value={fmt(air.carbon_monoxide, 0)} unit="µg/m³" />
                      <Metric label="Dust" value={fmt(air.dust, 1)} unit="µg/m³" />
                      <Metric label="Aerosol optical depth" value={fmt(air.aerosol_optical_depth, 2)} unit="AOD" />
                    </div>
                  </div>
                </section>
              )}

              <section className="sheet">
                <div className="figure-head">
                  <div>
                    <p className="figure-id">Fig. 1</p>
                    <h3>Next 24 hours</h3>
                  </div>
                  <span className="legend">
                    <i className="swatch ice" /> Temperature
                    <i className="swatch copper" /> Precipitation
                  </span>
                </div>
                <HourRibbon temps={hours.map((hour) => hour.temp)} precips={hours.map((hour) => hour.precip)} />
                <div className="hour-axis">
                  {hours.filter((_, index) => index % 4 === 0).map((hour) => (
                    <span key={hour.time}>{hourLabel(hour.time)}</span>
                  ))}
                </div>
              </section>

              <section className="sheet">
                <div className="figure-head">
                  <div>
                    <p className="figure-id">Fig. 2</p>
                    <h3>Seven days</h3>
                  </div>
                  <span className="legend">
                    <i className="swatch copper" /> High
                    <i className="swatch ice" /> Low
                  </span>
                </div>
                <WeekChart maxes={weather.daily.temperature_2m_max} mins={weather.daily.temperature_2m_min} />
                <div className="days">
                  {weather.daily.time.map((day, index) => (
                    <article key={day}>
                      <strong>{weekdayIso(day)}</strong>
                      <span>{weatherText(weather.daily.weather_code[index])}</span>
                      <b>
                        {fmt(weather.daily.temperature_2m_max[index], 0)}° / {fmt(weather.daily.temperature_2m_min[index], 0)}°
                      </b>
                      <em>Rain {fmt(weather.daily.precipitation_sum[index], 1)} mm · {fmt(weather.daily.precipitation_probability_max[index], 0)}%</em>
                      <em>Wind {fmt(weather.daily.wind_speed_10m_max[index], 0)} · UV {fmt(weather.daily.uv_index_max[index], 0)} · ET₀ {fmt(weather.daily.et0_fao_evapotranspiration[index], 1)}</em>
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
                  <p className="figure-id">Fig. 3</p>
                  <h3>Climate outlook</h3>
                </div>
                <span className="hint">Unweighted mean of three HighResMIP models</span>
              </div>
              {climateState === "loading" && <div className="skeleton climate-skeleton" />}
              {climateState === "error" && <p className="inline-error">The climate-model series failed to load for this point.</p>}
              {climate && outlook && climateState === "ready" && (
                <>
                  <div className="delta-row">
                    <article>
                      <p>Annual temperature change</p>
                      <strong className={outlook.annualTempDelta >= 0 ? "hot" : "cold"}>{fmtSigned(outlook.annualTempDelta, 2)}°C</strong>
                      <span>
                        {fmt(climate.baseline.annualTemp, 1)}° in {outlook.baselineLabel} to {fmt(climate.future.annualTemp, 1)}° in {outlook.futureLabel}
                      </span>
                    </article>
                    <article>
                      <p>Annual precipitation change</p>
                      <strong>{fmtSigned(outlook.annualPrecipDeltaPct, 1)}%</strong>
                      <span>
                        {fmt(climate.baseline.annualPrecip, 0)} to {fmt(climate.future.annualPrecip, 0)} mm
                      </span>
                    </article>
                  </div>
                  <div className="figure-head tight">
                    <h3>Monthly mean temperature</h3>
                    <span className="legend">
                      <i className="swatch ice" /> 1991–2000
                      <i className="swatch copper" /> 2041–2050
                    </span>
                  </div>
                  <ClimateLines baseline={climate.baseline.temp} future={climate.future.temp} low={climate.future.tempLow} high={climate.future.tempHigh} />
                  <p className="hint">The copper band is the spread across the three models in 2041–2050. Mean monthly spread {fmt(outlook.futureSpread, 2)}°C.</p>
                  <div className="figure-head tight">
                    <h3>Monthly precipitation</h3>
                  </div>
                  <PrecipBars baseline={climate.baseline.precip} future={climate.future.precip} />
                  <table className="model-table">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>1991–2000</th>
                        <th>2041–2050</th>
                        <th>ΔT</th>
                        <th>Future rain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outlook.models.map((model) => (
                        <tr key={model.label}>
                          <td>{model.label}</td>
                          <td>{fmt(model.baselineTemp, 2)}°</td>
                          <td>{fmt(model.futureTemp, 2)}°</td>
                          <td>{fmtSigned(model.tempDelta, 2)}°</td>
                          <td>{fmt(model.futurePrecip, 0)} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="disclaimer">
                    Model-grid means, not station observations. HighResMIP through 2050 is not a substitute for CMIP6 scenarios or the IPCC reports when a decision has to be official. The reduction itself is in <code>src/lib/outlook.ts</code>.
                  </p>
                </>
              )}
            </section>
          )}

          {desk === "briefing" && flood && (
            <section className="sheet">
              <div className="figure-head">
                <div>
                  <p className="figure-id">Hydrology</p>
                  <h3>River discharge</h3>
                </div>
                <span className="hint">GloFAS · nearest watercourse</span>
              </div>
              {Math.max(...flood.river_discharge.map((value) => (value != null && Number.isFinite(value) ? value : 0))) < 0.05 ? (
                <p className="prose">The nearest watercourse is negligible this week.</p>
              ) : (
                <DischargeLine values={flood.river_discharge} />
              )}
            </section>
          )}

          <section className="sheet about">
            <p className="figure-id">Record</p>
            <h3>About this briefing</h3>
            <p className="prose">
              ClimaScope keeps the forecast, the air column, GloFAS discharge, and the HighResMIP decade comparison on one sheet. Another project can import the ensemble without the map.
            </p>
            <div className="developer">
              <a href={`mailto:${DEVELOPER_EMAIL}`}>
                <span>Developer</span>
                {DEVELOPER_EMAIL}
              </a>
              <a href="https://github.com/naomi197" target="_blank" rel="noreferrer">
                <span>GitHub</span>
                github.com/naomi197
              </a>
            </div>
            <p className="hint">Sources: Open-Meteo forecast, air quality, climate, and flood APIs; global-warming.org for CO₂, methane, N₂O, the GISS anomaly, and sea ice; Esri basemap. Version 1.1.0.</p>
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
