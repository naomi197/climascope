import { CLIMATE_MODELS, summarizePeriod, type PeriodSummary } from "./climate.ts"

export type Place = {
  name: string
  admin?: string
  country?: string
  latitude: number
  longitude: number
}

export type CurrentWeather = {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  cloud_cover: number
  pressure_msl: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
  visibility: number
  uv_index: number
  dew_point_2m: number
  vapour_pressure_deficit: number
  et0_fao_evapotranspiration: number
  cape: number
  shortwave_radiation: number
  is_day: number
}

export type WeatherBundle = {
  elevation: number
  timezone: string
  timezoneAbbreviation: string
  current: CurrentWeather
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    wind_speed_10m_max: number[]
    uv_index_max: number[]
    sunrise: string[]
    sunset: string[]
    et0_fao_evapotranspiration: number[]
  }
}

export type AirCurrent = {
  european_aqi: number
  us_aqi: number
  pm10: number
  pm2_5: number
  carbon_monoxide: number
  nitrogen_dioxide: number
  sulphur_dioxide: number
  ozone: number
  dust: number
  aerosol_optical_depth: number
}

export type FloodSeries = {
  time: string[]
  river_discharge: Array<number | null>
}

export type ClimateCompare = {
  baseline: PeriodSummary
  future: PeriodSummary
}

export type GlobalIndicators = {
  co2: { value: number; cycle: number; when: string; series: number[] }
  methane: { value: number; when: string; series: number[] }
  nitrous: { value: number; when: string; series: number[] }
  temperature: { value: number; when: string; series: number[] }
  ice: { extent: number; anomaly: number; when: string; trend: number; series: number[] }
}

export const PRESETS: Place[] = [
  { name: "Tehran", admin: "Tehran Province", country: "Iran", latitude: 35.69439, longitude: 51.42151 },
  { name: "Ahvaz", admin: "Khuzestan", country: "Iran", latitude: 31.3183, longitude: 48.6706 },
  { name: "Bandar Abbas", admin: "Hormozgan", country: "Iran", latitude: 27.1832, longitude: 56.2666 },
  { name: "Rasht", admin: "Gilan", country: "Iran", latitude: 37.2808, longitude: 49.5832 },
  { name: "Tabriz", admin: "East Azerbaijan", country: "Iran", latitude: 38.08, longitude: 46.2919 },
  { name: "Mashhad", admin: "Razavi Khorasan", country: "Iran", latitude: 36.2605, longitude: 59.6168 },
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125 },
  { name: "Male", country: "Maldives", latitude: 4.1755, longitude: 73.5093 },
  { name: "Manaus", country: "Brazil", latitude: -3.119, longitude: -60.0217 },
  { name: "Nuuk", country: "Greenland", latitude: 64.1814, longitude: -51.6941 },
  { name: "Arctic Ocean", latitude: 85, longitude: 15 },
  { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
]

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return (await response.json()) as T
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const coordinate = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,،]\s*(-?\d+(?:\.\d+)?)$/)
  if (coordinate) {
    const latitude = Number(coordinate[1])
    const longitude = Number(coordinate[2])
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return [await reversePlace(latitude, longitude, signal)]
    }
  }
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
  const data = await getJson<{
    results?: Array<{
      name: string
      admin1?: string
      country?: string
      latitude: number
      longitude: number
    }>
  }>(url, signal)
  return (data.results ?? []).map((item) => ({
    name: item.name,
    admin: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
  }))
}

export async function reversePlace(latitude: number, longitude: number, signal?: AbortSignal): Promise<Place> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  const response = await fetch(url, { signal })
  const data = (await response.json()) as {
    city?: string
    locality?: string
    principalSubdivision?: string
    countryName?: string
  }
  const name = data.city || data.locality || "Selected point"
  return {
    name,
    admin: data.principalSubdivision,
    country: data.countryName,
    latitude,
    longitude,
  }
}

export async function loadWeather(place: Place, signal?: AbortSignal): Promise<WeatherBundle> {
  const current = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "weather_code",
    "cloud_cover",
    "pressure_msl",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "visibility",
    "uv_index",
    "dew_point_2m",
    "vapour_pressure_deficit",
    "et0_fao_evapotranspiration",
    "cape",
    "shortwave_radiation",
    "is_day",
  ].join(",")
  const hourly = "temperature_2m,precipitation"
  const daily = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "precipitation_probability_max",
    "wind_speed_10m_max",
    "uv_index_max",
    "sunrise",
    "sunset",
    "et0_fao_evapotranspiration",
  ].join(",")
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=${current}&hourly=${hourly}&daily=${daily}&forecast_days=7&timezone=auto`
  const data = await getJson<{
    elevation: number
    timezone: string
    timezone_abbreviation: string
    current: CurrentWeather
    hourly: WeatherBundle["hourly"]
    daily: WeatherBundle["daily"]
  }>(url, signal)
  return {
    elevation: data.elevation,
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    current: data.current,
    hourly: data.hourly,
    daily: data.daily,
  }
}

export async function loadAir(place: Place, signal?: AbortSignal): Promise<AirCurrent> {
  const fields = "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,aerosol_optical_depth"
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=${fields}&timezone=auto`
  const data = await getJson<{ current: AirCurrent }>(url, signal)
  return data.current
}

export async function loadFlood(place: Place, signal?: AbortSignal): Promise<FloodSeries | null> {
  const url =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=river_discharge&forecast_days=7`
  try {
    const data = await getJson<{ daily?: { time: string[]; river_discharge: Array<number | null> } }>(url, signal)
    if (!data.daily) return null
    return { time: data.daily.time, river_discharge: data.daily.river_discharge }
  } catch {
    return null
  }
}

export async function loadClimate(place: Place, signal?: AbortSignal): Promise<ClimateCompare> {
  const models = CLIMATE_MODELS.map((model) => model.id).join(",")
  const fields = "temperature_2m_mean,precipitation_sum"
  const base =
    `https://climate-api.open-meteo.com/v1/climate?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&models=${models}&daily=${fields}`
  const [baselineRaw, futureRaw] = await Promise.all([
    getJson<{ daily: Record<string, Array<string | number | null>> }>(
      `${base}&start_date=1991-01-01&end_date=2000-12-31`,
      signal,
    ),
    getJson<{ daily: Record<string, Array<string | number | null>> }>(
      `${base}&start_date=2041-01-01&end_date=2050-12-31`,
      signal,
    ),
  ])
  return {
    baseline: summarizePeriod(baselineRaw.daily),
    future: summarizePeriod(futureRaw.daily),
  }
}

export async function loadGlobals(signal?: AbortSignal): Promise<GlobalIndicators> {
  const [co2, methane, nitrous, temperature, arctic] = await Promise.all([
    getJson<{ co2: Array<{ year: string; month: string; day: string; cycle: string; trend: string }> }>(
      "https://global-warming.org/api/co2-api",
      signal,
    ),
    getJson<{ methane: Array<{ date: string; average: string; trend: string }> }>(
      "https://global-warming.org/api/methane-api",
      signal,
    ),
    getJson<{ nitrous: Array<{ date: string; average: string; trend: string }> }>(
      "https://global-warming.org/api/nitrous-oxide-api",
      signal,
    ),
    getJson<{ result: Array<{ time: string; station: string; land: string }> }>(
      "https://global-warming.org/api/temperature-api",
      signal,
    ),
    getJson<{
      arcticData: {
        description: { decadalTrend: number }
        data: Record<string, { value: number; anom: number }>
      }
    }>("https://global-warming.org/api/arctic-api", signal),
  ])

  const co2Points = co2.co2
  const lastCo2 = co2Points[co2Points.length - 1]
  const ch4Points = methane.methane
  const lastCh4 = ch4Points[ch4Points.length - 1]
  const n2oPoints = nitrous.nitrous
  const lastN2o = n2oPoints[n2oPoints.length - 1]
  const tempPoints = temperature.result
  const lastTemp = tempPoints[tempPoints.length - 1]
  const iceEntries = Object.entries(arctic.arcticData.data).filter(([, row]) => row.value > -900)
  const lastIce = iceEntries[iceEntries.length - 1]

  return {
    co2: {
      value: Number(lastCo2.trend),
      cycle: Number(lastCo2.cycle),
      when: `${lastCo2.year}-${lastCo2.month}-${lastCo2.day}`,
      series: co2Points.slice(-180).map((point) => Number(point.trend)),
    },
    methane: {
      value: Number(lastCh4.trend),
      when: lastCh4.date,
      series: ch4Points.slice(-120).map((point) => Number(point.trend)),
    },
    nitrous: {
      value: Number(lastN2o.trend),
      when: lastN2o.date,
      series: n2oPoints.slice(-120).map((point) => Number(point.trend)),
    },
    temperature: {
      value: Number(lastTemp.land),
      when: lastTemp.time,
      series: tempPoints.slice(-180).map((point) => Number(point.land)),
    },
    ice: {
      extent: lastIce[1].value,
      anomaly: lastIce[1].anom,
      when: lastIce[0],
      trend: arctic.arcticData.description.decadalTrend,
      series: iceEntries.slice(-120).map(([, row]) => row.anom),
    },
  }
}
