import { shortMonth } from "../lib/format.ts"

const INK = "#1d4e89"
const COPPER = "#9a4e24"
const GRID = "#e4dfd3"
const MUTE = "#6f6a60"

type Point = { x: number; y: number }

function chartFrame(values: number[][], width: number, height: number, pad: { l: number; r: number; t: number; b: number }) {
  const flat = values.flat().filter((value) => Number.isFinite(value))
  const min = Math.min(...flat)
  const max = Math.max(...flat)
  const span = max - min || 1
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const project = (series: number[]): Point[] =>
    series.map((value, index) => ({
      x: pad.l + (series.length <= 1 ? innerW / 2 : (index / (series.length - 1)) * innerW),
      y: pad.t + ((max - (Number.isFinite(value) ? value : min)) / span) * innerH,
    }))
  const yAt = (value: number) => pad.t + ((max - value) / span) * innerH
  return { project, min, max, pad, width, height, yAt, innerW }
}

function linePath(points: Point[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
}

function Grid({ min, max, yAt, left, right }: { min: number; max: number; yAt: (value: number) => number; left: number; right: number }) {
  const steps = 3
  return (
    <g>
      {Array.from({ length: steps + 1 }, (_, index) => {
        const value = min + ((max - min) * index) / steps
        const y = yAt(value)
        return (
          <g key={index}>
            <line x1={left} x2={right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
            <text x={left - 6} y={y + 3} textAnchor="end" className="chart-tick">
              {value.toFixed(0)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function Sparkline({ values, color = INK }: { values: number[]; color?: string }) {
  const clean = values.filter((value) => Number.isFinite(value))
  if (clean.length < 2) return null
  const { project, min, max, yAt } = chartFrame([clean], 160, 36, { l: 0, r: 0, t: 3, b: 3 })
  const points = project(clean)
  const mid = yAt((min + max) / 2)
  return (
    <svg className="spark" viewBox="0 0 160 36" aria-hidden="true">
      <line x1="0" x2="160" y1={mid} y2={mid} stroke={GRID} strokeWidth="1" />
      <path d={linePath(points)} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function HourRibbon({ temps, precips }: { temps: number[]; precips: number[] }) {
  const width = 640
  const height = 188
  const pad = { l: 36, r: 12, t: 16, b: 28 }
  const { project, min, max, yAt } = chartFrame([temps], width, height, pad)
  const points = project(temps)
  const baseY = height - pad.b
  const area = `${linePath(points)} L${points[points.length - 1]?.x ?? pad.l} ${baseY} L${points[0]?.x ?? pad.l} ${baseY} Z`
  const maxPrecip = Math.max(...precips, 0.1)
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Temperature and precipitation over the next 24 hours">
      <Grid min={min} max={max} yAt={yAt} left={pad.l} right={width - pad.r} />
      <path d={area} fill="rgba(29,78,137,0.08)" />
      <path d={linePath(points)} fill="none" stroke={INK} strokeWidth="1.8" />
      {precips.map((value, index) => {
        const x = points[index]?.x ?? 0
        const h = (value / maxPrecip) * 22
        return <rect key={index} x={x - 2.2} y={baseY - h} width="4.4" height={h} fill={COPPER} opacity={value > 0 ? 0.85 : 0.25} />
      })}
      <text x={pad.l} y={height - 8} className="chart-tick">
        now
      </text>
      <text x={width - pad.r} y={height - 8} textAnchor="end" className="chart-tick">
        +24 h
      </text>
      <text x={width - pad.r} y="14" textAnchor="end" className="chart-tick">
        °C · bars are precipitation
      </text>
    </svg>
  )
}

export function ClimateLines({
  baseline,
  future,
  low,
  high,
}: {
  baseline: number[]
  future: number[]
  low: number[]
  high: number[]
}) {
  const width = 640
  const height = 230
  const pad = { l: 36, r: 12, t: 16, b: 28 }
  const { project, min, max, yAt } = chartFrame([baseline, future, low, high], width, height, pad)
  const base = project(baseline)
  const next = project(future)
  const upper = project(high)
  const lower = project(low)
  const band = `${linePath(upper)} ${[...lower].reverse().map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly mean temperature, baseline and future ensemble">
      <Grid min={min} max={max} yAt={yAt} left={pad.l} right={width - pad.r} />
      <path d={band} fill="rgba(154,78,36,0.14)" />
      <path d={linePath(base)} fill="none" stroke={INK} strokeWidth="1.7" />
      <path d={linePath(next)} fill="none" stroke={COPPER} strokeWidth="1.9" />
      {base.map((point, index) => (
        <text key={index} x={point.x} y={height - 8} textAnchor="middle" className="chart-tick">
          {shortMonth(index)}
        </text>
      ))}
      <text x={width - pad.r} y="14" textAnchor="end" className="chart-tick">
        °C
      </text>
    </svg>
  )
}

export function PrecipBars({ baseline, future }: { baseline: number[]; future: number[] }) {
  const width = 640
  const height = 196
  const pad = { l: 36, r: 12, t: 16, b: 28 }
  const max = Math.max(...baseline.filter(Number.isFinite), ...future.filter(Number.isFinite), 1)
  const plotW = width - pad.l - pad.r
  const slot = plotW / 12
  const baseY = height - pad.b
  const scale = (value: number) => ((Number.isFinite(value) ? value : 0) / max) * (baseY - pad.t)
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly precipitation, baseline and future ensemble">
      <line x1={pad.l} x2={width - pad.r} y1={baseY} y2={baseY} stroke={GRID} />
      <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" className="chart-tick">
        {max.toFixed(0)}
      </text>
      <text x={pad.l - 6} y={baseY} textAnchor="end" className="chart-tick">
        0
      </text>
      {baseline.map((value, index) => {
        const x = pad.l + index * slot + slot / 2
        const baseH = scale(value)
        const nextH = scale(future[index] ?? 0)
        return (
          <g key={index}>
            <rect x={x - 9} y={baseY - baseH} width="7" height={baseH} fill={INK} />
            <rect x={x + 1} y={baseY - nextH} width="7" height={nextH} fill={COPPER} />
            <text x={x} y={height - 8} textAnchor="middle" className="chart-tick">
              {shortMonth(index)}
            </text>
          </g>
        )
      })}
      <text x={width - pad.r} y="14" textAnchor="end" className="chart-tick">
        mm
      </text>
    </svg>
  )
}

export function AqiGauge({ value }: { value: number }) {
  const capped = Math.max(0, Math.min(value, 100))
  const angle = (capped / 100) * 180
  const radians = ((180 - angle) * Math.PI) / 180
  const cx = 110
  const cy = 104
  const r = 78
  const x = cx + r * Math.cos(radians)
  const y = cy - r * Math.sin(radians)
  return (
    <svg className="gauge" viewBox="0 0 220 128" role="img" aria-label="European air quality index">
      <path d="M32 104 A78 78 0 0 1 188 104" fill="none" stroke="#e6e1d6" strokeWidth="10" />
      <path d="M32 104 A78 78 0 0 1 188 104" fill="none" stroke="url(#aqiScale)" strokeWidth="10" />
      <circle cx={x} cy={y} r="4.5" fill="#17211c" />
      <text x="32" y="122" className="chart-tick">
        0
      </text>
      <text x="188" y="122" textAnchor="end" className="chart-tick">
        100
      </text>
      <defs>
        <linearGradient id="aqiScale" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f7a4d" />
          <stop offset="45%" stopColor="#8a5a12" />
          <stop offset="100%" stopColor="#8d2f2a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function DischargeLine({ values }: { values: Array<number | null> }) {
  const series = values.map((value) => (value != null && Number.isFinite(value) ? value : Number.NaN))
  const width = 640
  const height = 120
  const pad = { l: 42, r: 12, t: 14, b: 12 }
  const { project, min, max, yAt } = chartFrame([series], width, height, pad)
  const points = project(series)
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="River discharge over seven days">
      <Grid min={min} max={max} yAt={yAt} left={pad.l} right={width - pad.r} />
      <path d={linePath(points)} fill="none" stroke={INK} strokeWidth="1.8" />
      <text x={width - pad.r} y="12" textAnchor="end" className="chart-tick">
        m³/s
      </text>
    </svg>
  )
}

export function WeekChart({ maxes, mins }: { maxes: number[]; mins: number[] }) {
  const width = 640
  const height = 168
  const pad = { l: 36, r: 12, t: 14, b: 16 }
  const { project, min, max, yAt } = chartFrame([maxes, mins], width, height, pad)
  const hi = project(maxes)
  const lo = project(mins)
  const band = `${linePath(hi)} ${[...lo].reverse().map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Seven-day temperature range">
      <Grid min={min} max={max} yAt={yAt} left={pad.l} right={width - pad.r} />
      <path d={band} fill="rgba(29,78,137,0.08)" />
      <path d={linePath(hi)} fill="none" stroke={COPPER} strokeWidth="1.7" />
      <path d={linePath(lo)} fill="none" stroke={INK} strokeWidth="1.7" />
      <text x={width - pad.r} y="12" textAnchor="end" className="chart-tick" fill={MUTE}>
        °C
      </text>
    </svg>
  )
}
