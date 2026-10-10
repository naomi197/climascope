import assert from "node:assert/strict"
import test from "node:test"
import { CLIMATE_MODELS, summarizePeriod } from "../src/lib/climate.ts"
import { stationOutlook } from "../src/lib/outlook.ts"

const models = CLIMATE_MODELS.slice(0, 2)

function daily(rows: Array<{ date: string; temps: number[]; precips: number[] }>) {
  const record: Record<string, Array<string | number | null>> = {
    time: rows.map((row) => row.date),
  }
  models.forEach((model, modelIndex) => {
    record[`temperature_2m_mean_${model.id}`] = rows.map((row) => row.temps[modelIndex])
    record[`precipitation_sum_${model.id}`] = rows.map((row) => row.precips[modelIndex])
  })
  return record
}

test("monthly ensemble averages each model, then the models", () => {
  const summary = summarizePeriod(
    daily([
      { date: "1991-01-01", temps: [10, 14], precips: [1, 3] },
      { date: "1991-01-02", temps: [12, 16], precips: [1, 1] },
      { date: "1991-07-01", temps: [20, 24], precips: [0, 2] },
    ]),
    models,
  )

  assert.equal(summary.temp[0], 13)
  assert.equal(summary.temp[6], 22)
  assert.equal(summary.tempLow[0], 11)
  assert.equal(summary.tempHigh[0], 15)
  assert.equal(summary.precip[0], 3)
  assert.equal(summary.models[0]?.annualTemp, (10 + 12 + 20) / 3)
  assert.equal(summary.annualTemp, ((10 + 12 + 20) / 3 + (14 + 16 + 24) / 3) / 2)
})

test("missing model days stay out of the mean and the spread", () => {
  const summary = summarizePeriod(
    daily([
      { date: "1991-03-01", temps: [Number.NaN, 6], precips: [Number.NaN, 4] },
      { date: "1991-03-02", temps: [8, 12], precips: [2, 2] },
    ]),
    models,
  )

  assert.equal(summary.temp[2], 8.5)
  assert.equal(summary.tempLow[2], 8)
  assert.equal(summary.tempHigh[2], 9)
  assert.equal(Number.isFinite(summary.temp[0]), false)
  assert.equal(summary.models[0]?.annualTemp, 8)
  assert.equal(summary.models[1]?.annualTemp, 9)
})

test("station outlook reports decade change, month anomaly, and model deltas", () => {
  const baseline = summarizePeriod(
    daily([
      { date: "1991-10-01", temps: [10, 12], precips: [2, 2] },
      { date: "1992-10-01", temps: [10, 12], precips: [2, 2] },
    ]),
    models,
  )
  const future = summarizePeriod(
    daily([
      { date: "2041-10-01", temps: [12, 16], precips: [1, 3] },
      { date: "2042-10-01", temps: [12, 16], precips: [1, 3] },
    ]),
    models,
  )

  const outlook = stationOutlook({ baseline, future }, 9, 15)
  assert.equal(outlook.annualTempDelta, 3)
  assert.equal(outlook.annualPrecipDeltaPct, 0)
  assert.equal(outlook.monthAnomaly, 4)
  assert.equal(outlook.futureSpread, 4)
  assert.deepEqual(
    outlook.models.map((model) => model.tempDelta),
    [2, 4],
  )
})
