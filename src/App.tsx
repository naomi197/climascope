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
  weatherText,
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
            <p className="eyebrow">Climate observatory</p>
            <h1>ClimaScope</h1>
          </div>
        </div>
        <p className="lede">Atmosphere, air quality, hydrology, and climate-model outlook for any point on Earth.</p>
      </header>

      <section className="pulse" aria-label="Global indicators">
        {globalState === "error" && <p className="inline-error">Global indicators are unavailable right now.</p>}
        {globalState === "loading" &&
          Array.from({ length: 5 }, (_, index) => <div key={index} className="pulse-card skeleton" />)}
        {globals && (
          <>
            <PulseCard
              kicker="Carbon dioxide"
              value={fmt(globals.co2.value, 2)}
              unit="ppm trend"
              note={`cycle ${fmt(globals.co2.cycle, 1)} · ${labelIsoDate(globals.co2.when)}`}
              series={globals.co2.series}
              color="#e8a06a"
            />
            <PulseCard
              kicker="Methane"
              value={fmt(globals.methane.value, 1)}
              unit="ppb trend"
              note={ch4When}
              series={globals.methane.series}
              color="#e7c56a"
            />
            <PulseCard
              kicker="Nitrous oxide"
              value={fmt(globals.nitrous.value, 2)}
              unit="ppb trend"
              note={n2oWhen}
              series={globals.nitrous.series}
              color="#8ecbff"
            />
            <PulseCard
              kicker="Global temperature anomaly"
              value={fmtSigned(globals.temperature.value, 2)}
              unit="°C land-ocean"
              note={labelDecimalYear(globals.temperature.when)}
              series={globals.temperature.series}
              color="#ff8f78"
            />
            <PulseCard
              kicker="Sea ice"
              value={fmtSigned(globals.ice.anomaly, 2)}
              unit="million km² anomaly"
              note={`${fmt(globals.ice.extent, 2)} extent · ${iceWhen}`}
              series={globals.ice.series}
              color="#8ecbff"
            />
          </>
        )}
      </section>

      <div className="workspace">
        <aside className="finder">
          <div className="search">
            <label htmlFor="place-search">Place or coordinates</label>
            <div className="search-row">
              <input
                id="place-search"
                value={query}
                placeholder="City, country, or lat, lon"
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              <button type="button" className="ghost" onClick={() => void locateMe()}>
                My location
              </button>
            </div>
            {searching && <p className="hint">Searching…</p>}
            {shownResults.length > 0 && (
              <ul className="results">
                {shownResults.map((item) => (
                  <li key={`${item.latitude}-${item.longitude}-${item.name}`}>
                    <button
                      type="button"
                      onClick={() => openPlace(item)}
                    >
                      <strong>{item.name}</strong>
                      <span>{[item.admin, item.country].filter(Boolean).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="chips" aria-label="Saved places">
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
            <p className="map-caption">Tap the map to open that coordinate.</p>
          </div>
          {notice && <p className="inline-error">{notice}</p>}
        </aside>

        <main className="board">
          <section className="place-head">
            <div>
              <p className="eyebrow">Virtual station</p>
              <h2>{place.name}</h2>
              <p className="sub">{[place.admin, place.country].filter(Boolean).join(", ")}</p>
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

          {wxState === "error" && (
            <section className="panel error-panel">
              <h3>This location could not be loaded</h3>
              <p>Check the connection and try again.</p>
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
                Try again
              </button>
            </section>
          )}

          {wxState === "loading" && (
            <section className="panel skeleton-block" aria-label="Loading observations">
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
                  <p className="eyebrow">{weather.current.is_day ? "Day" : "Night"} · {weather.timezoneAbbreviation}</p>
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
                  {anomaly != null && Number.isFinite(anomaly) && (
                    <p className={anomaly >= 0 ? "delta hot" : "delta cold"}>
                      {fmtSigned(anomaly, 1)}° vs the {monthName(monthIndex)} mean for 1991–2000
                    </p>
                  )}
                  <div className="scale" aria-hidden="true">
                    <i style={{ left: `${scalePos(weather.daily.temperature_2m_min[0], weather.daily.temperature_2m_max[0], weather.current.temperature_2m)}%` }} />
                  </div>
                </div>
              </section>

              <section className="metric-grid" aria-label="Current parameters">
                <Metric label="Humidity" value={fmt(weather.current.relative_humidity_2m, 0)} unit="%" />
                <Metric label="Dew point" value={fmt(weather.current.dew_point_2m, 1)} unit="°C" />
                <Metric label="Sea-level pressure" value={fmt(weather.current.pressure_msl, 0)} unit="hPa" />
                <Metric
                  label="Wind"
                  value={fmt(weather.current.wind_speed_10m, 1)}
                  unit={`km/h ${windDir(weather.current.wind_direction_10m)}`}
                  hint={`Gust ${fmt(weather.current.wind_gusts_10m, 0)}`}
                />
                <Metric label="Precipitation" value={fmt(weather.current.precipitation, 1)} unit="mm" />
                <Metric label="Cloud cover" value={fmt(weather.current.cloud_cover, 0)} unit="%" />
                <Metric label="Visibility" value={fmt(weather.current.visibility / 1000, 1)} unit="km" />
                <Metric label="UV index" value={fmt(weather.current.uv_index, 1)} unit={uvLabel(weather.current.uv_index)} />
                <Metric label="Vapor pressure deficit" value={fmt(weather.current.vapour_pressure_deficit, 2)} unit="kPa" />
                <Metric label="Reference evapotranspiration" value={fmt(weather.current.et0_fao_evapotranspiration, 2)} unit="mm" />
                <Metric label="Convective energy" value={fmt(weather.current.cape, 0)} unit="J/kg" />
                <Metric label="Shortwave radiation" value={fmt(weather.current.shortwave_radiation, 0)} unit="W/m²" />
              </section>

              {air && airInfo && (
                <section className="panel air">
                  <div className="section-title">
                    <h3>Air quality</h3>
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

              <section className="panel">
                <div className="section-title">
                  <h3>Next 24 hours</h3>
                  <span className="hint">Temperature line · precipitation bars</span>
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
                  <h3>Seven days</h3>
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
                      <em>
                        Rain {fmt(weather.daily.precipitation_sum[index], 1)} mm · chance {fmt(weather.daily.precipitation_probability_max[index], 0)}%
                      </em>
                      <em>
                        Wind {fmt(weather.daily.wind_speed_10m_max[index], 0)} · UV {fmt(weather.daily.uv_index_max[index], 0)} · ET₀ {fmt(weather.daily.et0_fao_evapotranspiration[index], 1)}
                      </em>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="panel">
            <div className="section-title">
              <h3>Climate outlook</h3>
              <span className="hint">Mean of three HighResMIP models</span>
            </div>
            {climateState === "loading" && <div className="skeleton climate-skeleton" />}
            {climateState === "error" && <p className="inline-error">The climate-model series failed to load for this point.</p>}
            {climate && climateState === "ready" && (
              <>
                <div className="delta-row">
                  <article>
                    <p>Annual temperature change</p>
                    <strong className={tempDelta != null && tempDelta >= 0 ? "hot" : "cold"}>{fmtSigned(tempDelta, 2)}°C</strong>
                    <span>
                      {fmt(climate.baseline.annualTemp, 1)}° in 1991–2000 to {fmt(climate.future.annualTemp, 1)}° in 2041–2050
                    </span>
                  </article>
                  <article>
                    <p>Annual precipitation change</p>
                    <strong>{fmtSigned(precipDelta, 1)}%</strong>
                    <span>
                      {fmt(climate.baseline.annualPrecip, 0)} to {fmt(climate.future.annualPrecip, 0)} mm
                    </span>
                  </article>
                </div>
                <div className="section-title tight">
                  <h3>Monthly mean temperature</h3>
                  <span className="legend">
                    <i className="swatch ice" /> 1991–2000
                    <i className="swatch copper" /> 2041–2050
                  </span>
                </div>
                <ClimateLines
                  baseline={climate.baseline.temp}
                  future={climate.future.temp}
                  low={climate.future.tempLow}
                  high={climate.future.tempHigh}
                />
                <p className="hint">The copper band is the spread across the three models in the future period.</p>
                <div className="section-title tight">
                  <h3>Monthly precipitation</h3>
                </div>
                <PrecipBars baseline={climate.baseline.precip} future={climate.future.precip} />
                <div className="models">
                  {climate.future.models.map((model, index) => {
                    const base = climate.baseline.models[index]
                    const delta = model.annualTemp - (base?.annualTemp ?? model.annualTemp)
                    return (
                      <p key={model.label}>
                        <strong>{model.label}</strong>
                        <span>{fmtSigned(delta, 2)}°C temperature · future rain {fmt(model.annualPrecip, 0)} mm</span>
                      </p>
                    )
                  })}
                </div>
                <p className="disclaimer">
                  These values are model-grid means, not station observations. The models are HighResMIP runs through 2050 and are not a substitute for CMIP6 scenarios or the IPCC reports when making official decisions.
                </p>
              </>
            )}
          </section>

          {flood && (
            <section className="panel">
              <div className="section-title">
                <h3>River discharge</h3>
                <span className="hint">GloFAS · nearest watercourse</span>
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
            <h3>About ClimaScope</h3>
            <p>
              A field tool for climate specialists: live atmosphere, pollutants, evapotranspiration, river discharge, and a two-decade model comparison.
            </p>
            <div className="developer">
              <p>Developer</p>
              <a href={`mailto:${DEVELOPER_EMAIL}`}>{DEVELOPER_EMAIL}</a>
            </div>
            <p className="hint">
              Sources: Open-Meteo for forecast, air quality, climate models, and flood; global-warming.org for CO₂, methane, N₂O, the GISS anomaly, and sea ice; Esri basemap.
            </p>
            <p className="hint">Version 1.0.0</p>
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
