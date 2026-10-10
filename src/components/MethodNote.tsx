import { CLIMATE_MODELS } from "../lib/climate.ts"
import { fmt, fmtSigned, monthName } from "../lib/format.ts"
import { BASELINE_PERIOD, FUTURE_PERIOD, type StationOutlook } from "../lib/outlook.ts"

export function MethodNote({ outlook }: { outlook: StationOutlook | null }) {
  return (
    <section className="sheet method" aria-labelledby="method-title">
      <p className="figure-id">Method</p>
      <h3 id="method-title">What the ensemble actually computes</h3>
      <p className="prose">
        ClimaScope is a station briefing joined to one reusable reduction of HighResMIP. For any coordinate it turns two decades of daily model output into a monthly ensemble mean, keeps the cross-model spread, and places today’s observation against the baseline month. The same reduction runs without this interface.
      </p>

      <dl className="defs">
        <div>
          <dt>Baseline</dt>
          <dd>
            {BASELINE_PERIOD.label}
            <span>
              {BASELINE_PERIOD.start} to {BASELINE_PERIOD.end}
            </span>
          </dd>
        </div>
        <div>
          <dt>Future</dt>
          <dd>
            {FUTURE_PERIOD.label}
            <span>
              {FUTURE_PERIOD.start} to {FUTURE_PERIOD.end}. The runs end in 2050.
            </span>
          </dd>
        </div>
        <div>
          <dt>Models</dt>
          <dd>{CLIMATE_MODELS.map((model) => model.label).join(" · ")}</dd>
        </div>
        <div>
          <dt>Temperature</dt>
          <dd>Daily mean, averaged inside each month and model, then an unweighted mean of the three models.</dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>Daily totals summed inside each year, then averaged across the years of the decade. The monthly bars use the same year count.</dd>
        </div>
        <div>
          <dt>Spread</dt>
          <dd>For each future month, the highest model minus the lowest. The shaded band is that range, not an uncertainty interval from a larger CMIP6 set.</dd>
        </div>
      </dl>

      {outlook && (
        <div className="worked">
          <p className="figure-id">This station</p>
          <p className="prose">
            The grid-cell mean changes by {fmtSigned(outlook.annualTempDelta, 2)}°C from {outlook.baselineLabel} to {outlook.futureLabel}.
            {outlook.monthAnomaly != null && (
              <>
                {" "}
                The current temperature is {fmtSigned(outlook.monthAnomaly, 1)}°C against the {monthName(outlook.monthIndex)} baseline.
              </>
            )}{" "}
            Mean future monthly spread is {fmt(outlook.futureSpread, 2)}°C.
            {outlook.annualPrecipDeltaPct != null && (
              <> Annual precipitation changes by {fmtSigned(outlook.annualPrecipDeltaPct, 1)}%.</>
            )}
          </p>
        </div>
      )}

      <pre className="code">
        <code>{`import { summarizePeriod } from "./lib/climate.ts"
import { stationOutlook } from "./lib/outlook.ts"

const baseline = summarizePeriod(baselineDaily)
const future = summarizePeriod(futureDaily)
const briefing = stationOutlook({ baseline, future }, monthIndex, observedTemperature)`}</code>
      </pre>

      <p className="prose limit">
        These are model-grid means, not station observations, and not a substitute for CMIP6 scenarios or the IPCC reports when a decision has to be official. A worked fixture ships in <code>examples/monthly-ensemble.ts</code>. The checks in <code>test/outlook.test.ts</code> lock the monthly mean, the ignored missing days, and the decade delta.
      </p>
    </section>
  )
}
