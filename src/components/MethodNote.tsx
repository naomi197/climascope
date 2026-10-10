import type { Copy } from "../lib/copy.ts"
import { CLIMATE_MODELS } from "../lib/climate.ts"
import { fmt, fmtSigned, monthName } from "../lib/format.ts"
import { BASELINE_PERIOD, FUTURE_PERIOD, type StationOutlook } from "../lib/outlook.ts"

export function MethodNote({ outlook, t }: { outlook: StationOutlook | null; t: Copy }) {
  return (
    <section className="sheet method" aria-labelledby="method-title">
      <p className="figure-id">{t.method}</p>
      <h3 id="method-title">{t.methodTitle}</h3>
      <p className="prose">{t.methodLead}</p>

      <dl className="defs">
        <div>
          <dt>{t.baseline}</dt>
          <dd>
            {BASELINE_PERIOD.label}
            <span>
              {BASELINE_PERIOD.start} {t.between} {BASELINE_PERIOD.end}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.future}</dt>
          <dd>
            {FUTURE_PERIOD.label}
            <span>
              {FUTURE_PERIOD.start} {t.between} {FUTURE_PERIOD.end}. {t.futureSpan}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.models}</dt>
          <dd>{CLIMATE_MODELS.map((model) => model.label).join(" · ")}</dd>
        </div>
        <div>
          <dt>{t.temperature}</dt>
          <dd>{t.temperatureDef}</dd>
        </div>
        <div>
          <dt>{t.precipitation}</dt>
          <dd>{t.precipDef}</dd>
        </div>
        <div>
          <dt>{t.spread}</dt>
          <dd>{t.spreadDef}</dd>
        </div>
      </dl>

      {outlook && (
        <div className="worked">
          <p className="figure-id">{t.thisStation}</p>
          <p className="prose">
            {t.worked({
              temp: fmtSigned(outlook.annualTempDelta, 2),
              from: outlook.baselineLabel,
              to: outlook.futureLabel,
              anomaly: outlook.monthAnomaly != null ? fmtSigned(outlook.monthAnomaly, 1) : null,
              month: monthName(outlook.monthIndex),
              spread: fmt(outlook.futureSpread, 2),
              precip: outlook.annualPrecipDeltaPct != null ? fmtSigned(outlook.annualPrecipDeltaPct, 1) : null,
            })}
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

      <p className="prose limit">{t.methodLimit}</p>
    </section>
  )
}
