# Reuse the ensemble

The observatory interface is optional. The reduction lives in two modules and does not fetch anything:

- `src/lib/climate.ts` exports `CLIMATE_MODELS` and `summarizePeriod`
- `src/lib/outlook.ts` exports `BASELINE_PERIOD`, `FUTURE_PERIOD`, and `stationOutlook`

```ts
import { summarizePeriod } from "./src/lib/climate.ts"
import { stationOutlook } from "./src/lib/outlook.ts"

const baseline = summarizePeriod(baselineDaily)
const future = summarizePeriod(futureDaily)
const briefing = stationOutlook({ baseline, future }, monthIndex, observedTemperature)
```

`baselineDaily` is the `daily` object returned by the Open-Meteo Climate API: a `time` array plus `temperature_2m_mean_<MODEL>` and `precipitation_sum_<MODEL>` for each model id in `CLIMATE_MODELS`.

Run the shipped fixture:

```bash
npm run example
```

To add a fourth model, extend `CLIMATE_MODELS` and pass that list as the second argument of `summarizePeriod`. The tests in `test/outlook.test.ts` show the expected monthly mean.
