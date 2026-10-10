/**
 * Reuse the HighResMIP summary without the observatory interface.
 *
 *   npm run example
 *
 * Replace the fixture with daily rows from Open-Meteo Climate API:
 *   temperature_2m_mean_<MODEL> and precipitation_sum_<MODEL>
 */
import { CLIMATE_MODELS, summarizePeriod } from "../src/lib/climate.ts"
import { FUTURE_PERIOD, BASELINE_PERIOD, stationOutlook } from "../src/lib/outlook.ts"

const [first, second] = CLIMATE_MODELS
const models = [first, second]

const baseline = summarizePeriod(
  {
    time: ["1991-06-01", "1991-06-02"],
    [`temperature_2m_mean_${first.id}`]: [18.2, 19.0],
    [`precipitation_sum_${first.id}`]: [0.4, 1.2],
    [`temperature_2m_mean_${second.id}`]: [17.4, 18.1],
    [`precipitation_sum_${second.id}`]: [0.2, 0.8],
  },
  models,
)

const future = summarizePeriod(
  {
    time: ["2041-06-01", "2041-06-02"],
    [`temperature_2m_mean_${first.id}`]: [20.4, 21.1],
    [`precipitation_sum_${first.id}`]: [0.1, 0.4],
    [`temperature_2m_mean_${second.id}`]: [19.8, 20.6],
    [`precipitation_sum_${second.id}`]: [0.0, 0.3],
  },
  models,
)

const outlook = stationOutlook({ baseline, future }, 5, 22.4)

console.log(`${BASELINE_PERIOD.label} → ${FUTURE_PERIOD.label}`)
console.log(`Annual temperature change: ${outlook.annualTempDelta.toFixed(2)} °C`)
console.log(`June anomaly against the baseline month: ${outlook.monthAnomaly?.toFixed(2)} °C`)
console.log(`Future cross-model spread: ${outlook.futureSpread.toFixed(2)} °C`)
for (const model of outlook.models) {
  console.log(`  ${model.label}: ${model.tempDelta.toFixed(2)} °C`)
}
