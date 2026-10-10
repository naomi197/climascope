import type { PeriodSummary } from "./climate.ts"

/** Decade used as the local baseline. This is a model decade, not the WMO 1991–2020 normal. */
export const BASELINE_PERIOD = {
  start: "1991-01-01",
  end: "2000-12-31",
  label: "1991–2000",
} as const

/** HighResMIP runs used here end in 2050, so the comparison decade stops at 2050. */
export const FUTURE_PERIOD = {
  start: "2041-01-01",
  end: "2050-12-31",
  label: "2041–2050",
} as const

export type EnsembleCompare = {
  baseline: PeriodSummary
  future: PeriodSummary
}

export type ModelDelta = {
  label: string
  baselineTemp: number
  futureTemp: number
  tempDelta: number
  baselinePrecip: number
  futurePrecip: number
}

export type StationOutlook = {
  baselineLabel: string
  futureLabel: string
  annualTempDelta: number
  annualPrecipDeltaPct: number | null
  monthIndex: number
  /** Observed temperature minus the baseline monthly ensemble mean. */
  monthAnomaly: number | null
  /** Mean of (model max − model min) across the twelve future months. */
  futureSpread: number
  models: ModelDelta[]
}

function finite(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

function mean(values: number[]): number {
  const clean = values.filter(finite)
  if (!clean.length) return Number.NaN
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

/**
 * Turn two `summarizePeriod` results into the station briefing.
 * The function has no network calls, so another project can reuse it on its own downloads.
 */
export function stationOutlook(
  compare: EnsembleCompare,
  monthIndex: number,
  observedTemperature?: number | null,
): StationOutlook {
  const month = ((monthIndex % 12) + 12) % 12
  const baselineMonth = compare.baseline.temp[month]
  const annualPrecipDeltaPct =
    finite(compare.baseline.annualPrecip) && compare.baseline.annualPrecip !== 0
      ? ((compare.future.annualPrecip - compare.baseline.annualPrecip) / compare.baseline.annualPrecip) * 100
      : null

  const models = compare.future.models.map((model, index) => {
    const baseline = compare.baseline.models[index]
    const baselineTemp = baseline?.annualTemp ?? Number.NaN
    return {
      label: model.label,
      baselineTemp,
      futureTemp: model.annualTemp,
      tempDelta: model.annualTemp - baselineTemp,
      baselinePrecip: baseline?.annualPrecip ?? Number.NaN,
      futurePrecip: model.annualPrecip,
    }
  })

  const monthlySpread = compare.future.tempHigh.map((high, index) => high - compare.future.tempLow[index])

  return {
    baselineLabel: BASELINE_PERIOD.label,
    futureLabel: FUTURE_PERIOD.label,
    annualTempDelta: compare.future.annualTemp - compare.baseline.annualTemp,
    annualPrecipDeltaPct,
    monthIndex: month,
    monthAnomaly:
      observedTemperature != null && finite(observedTemperature) && finite(baselineMonth)
        ? observedTemperature - baselineMonth
        : null,
    futureSpread: mean(monthlySpread),
    models,
  }
}
