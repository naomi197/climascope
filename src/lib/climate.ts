export const CLIMATE_MODELS = [
  { id: "MPI_ESM1_2_XR", label: "MPI-ESM1-2-XR" },
  { id: "EC_Earth3P_HR", label: "EC-Earth3P-HR" },
  { id: "MRI_AGCM3_2_S", label: "MRI-AGCM3-2-S" },
] as const

export type PeriodSummary = {
  temp: number[]
  tempLow: number[]
  tempHigh: number[]
  precip: number[]
  annualTemp: number
  annualPrecip: number
  models: { label: string; annualTemp: number; annualPrecip: number }[]
}

function avg(values: number[]): number {
  if (!values.length) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function finite(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

export function summarizePeriod(
  daily: Record<string, Array<string | number | null>>,
  models: readonly { id: string; label: string }[] = CLIMATE_MODELS,
): PeriodSummary {
  const time = daily.time as string[]
  const years = new Set(time.map((stamp) => stamp.slice(0, 4)))
  const yearCount = Math.max(1, years.size)

  const perModel = models.map((model) => {
    const temps = daily[`temperature_2m_mean_${model.id}`] as Array<number | null>
    const prec = daily[`precipitation_sum_${model.id}`] as Array<number | null>
    const tempBuckets = Array.from({ length: 12 }, () => [] as number[])
    const precBuckets = Array.from({ length: 12 }, () => [] as number[])
    const yearPrecip = new Map<string, number>()
    let tempSum = 0
    let tempCount = 0

    for (let index = 0; index < time.length; index += 1) {
      const month = Number(time[index].slice(5, 7)) - 1
      const year = time[index].slice(0, 4)
      const temperature = temps?.[index]
      const precipitation = prec?.[index]
      if (finite(temperature)) {
        tempBuckets[month].push(temperature)
        tempSum += temperature
        tempCount += 1
      }
      if (finite(precipitation)) {
        precBuckets[month].push(precipitation)
        yearPrecip.set(year, (yearPrecip.get(year) ?? 0) + precipitation)
      }
    }

    return {
      label: model.label,
      temp: tempBuckets.map((bucket) => avg(bucket)),
      precip: precBuckets.map((bucket) => bucket.reduce((sum, value) => sum + value, 0) / yearCount),
      annualTemp: tempCount ? tempSum / tempCount : Number.NaN,
      annualPrecip: avg([...yearPrecip.values()]),
    }
  })

  const temp = Array.from({ length: 12 }, (_, month) => avg(perModel.map((model) => model.temp[month]).filter(finite)))
  const precip = Array.from({ length: 12 }, (_, month) => avg(perModel.map((model) => model.precip[month]).filter(finite)))

  return {
    temp,
    tempLow: Array.from({ length: 12 }, (_, month) => Math.min(...perModel.map((model) => model.temp[month]).filter(finite))),
    tempHigh: Array.from({ length: 12 }, (_, month) => Math.max(...perModel.map((model) => model.temp[month]).filter(finite))),
    precip,
    annualTemp: avg(perModel.map((model) => model.annualTemp).filter(finite)),
    annualPrecip: avg(perModel.map((model) => model.annualPrecip).filter(finite)),
    models: perModel.map((model) => ({
      label: model.label,
      annualTemp: model.annualTemp,
      annualPrecip: model.annualPrecip,
    })),
  }
}
