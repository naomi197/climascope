import { shortMonth } from "../lib/format.ts"

type Point = { x: number; y: number }

function chartFrame(values: number[][], width: number, height: number, pad = 18) {
  const flat = values.flat().filter((value) => Number.isFinite(value))
  const min = Math.min(...flat)
  const max = Math.max(...flat)
  const span = max - min || 1
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const project = (series: number[]): Point[] =>
    series.map((value, index) => ({
      x: pad + (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW),
      y: pad + ((max - value) / span) * innerH,
    }))
  return { project, min, max, pad, width, height }
}

function linePath(points: Point[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
}

export function Sparkline({ values, color = "#2ee6c7" }: { values: number[]; color?: string }) {
  const clean = values.filter((value) => Number.isFinite(value))
  if (clean.length < 2) return null
  const { project } = chartFrame([clean], 120, 36, 2)
  const points = project(clean)
  return (
    <svg className="spark" viewBox="0 0 120 36" aria-hidden="true">
      <path d={linePath(points)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function HourRibbon({
  temps,
  precips,
}: {
  temps: number[]
  precips: number[]
}) {
  const width = 360
  const height = 148
  const { project, min, max } = chartFrame([temps], width, height, 16)
  const points = project(temps)
  const area = `${linePath(points)} L${points[points.length - 1]?.x ?? 16} 132 L${points[0]?.x ?? 16} 132 Z`
  const maxPrecip = Math.max(...precips, 1)
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="دمای ۲۴ ساعت آینده">
      <path d={area} fill="url(#tempFill)" />
      <path d={linePath(points)} fill="none" stroke="#2ee6c7" strokeWidth="2.4" />
      {precips.map((value, index) => {
        const x = points[index]?.x ?? 0
        const h = (value / maxPrecip) * 28
        return <rect key={index} x={x - 2} y={132 - h} width="4" height={h} rx="1" fill="rgba(232,160,106,.75)" />
      })}
      <text x="16" y="14" className="chart-label">
        {max.toFixed(0)}°
      </text>
      <text x="16" y="128" className="chart-label">
        {min.toFixed(0)}°
      </text>
      <defs>
        <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(46,230,199,.35)" />
          <stop offset="100%" stopColor="rgba(46,230,199,0)" />
        </linearGradient>
      </defs>
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
  const width = 360
  const height = 190
  const { project } = chartFrame([baseline, future, low, high], width, height, 22)
  const base = project(baseline)
  const next = project(future)
  const upper = project(high)
  const lower = project(low)
  const band = `${linePath(upper)} ${[...lower].reverse().map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="مقایسه دمای ماهانه دو دوره">
      <path d={band} fill="rgba(232,160,106,.16)" />
      <path d={linePath(base)} fill="none" stroke="#8ecbff" strokeWidth="2.2" />
      <path d={linePath(next)} fill="none" stroke="#e8a06a" strokeWidth="2.4" />
      {base.map((point, index) => (
        <text key={index} x={point.x} y="184" textAnchor="middle" className="chart-tick">
          {shortMonth(index)}
        </text>
      ))}
    </svg>
  )
}

export function PrecipBars({ baseline, future }: { baseline: number[]; future: number[] }) {
  const width = 360
  const height = 168
  const max = Math.max(...baseline, ...future, 1)
  const slot = width / 12
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="بارش ماهانه دو دوره">
      {baseline.map((value, index) => {
        const h = (value / max) * 120
        const x = index * slot + 8
        return (
          <g key={index}>
            <rect x={x} y={136 - h} width="8" height={h} rx="2" fill="#8ecbff" />
            <rect x={x + 10} y={136 - (future[index] / max) * 120} width="8" height={(future[index] / max) * 120} rx="2" fill="#e8a06a" />
            <text x={x + 9} y="156" textAnchor="middle" className="chart-tick">
              {shortMonth(index)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function AqiGauge({ value }: { value: number }) {
  const capped = Math.max(0, Math.min(value, 100))
  const angle = (capped / 100) * 180
  const radians = ((180 - angle) * Math.PI) / 180
  const cx = 90
  const cy = 88
  const r = 68
  const x = cx + r * Math.cos(radians)
  const y = cy - r * Math.sin(radians)
  return (
    <svg className="gauge" viewBox="0 0 180 110" role="img" aria-label="شاخص کیفیت هوا">
      <path d="M22 88 A68 68 0 0 1 158 88" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" strokeLinecap="round" />
      <path d="M22 88 A68 68 0 0 1 158 88" fill="none" stroke="url(#aqiScale)" strokeWidth="12" strokeLinecap="round" />
      <circle cx={x} cy={y} r="6" fill="#f4f7f6" />
      <defs>
        <linearGradient id="aqiScale" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3ddc97" />
          <stop offset="40%" stopColor="#e7c56a" />
          <stop offset="70%" stopColor="#e8a06a" />
          <stop offset="100%" stopColor="#ff6d7a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function WeekChart({
  maxes,
  mins,
}: {
  maxes: number[]
  mins: number[]
}) {
  const width = 360
  const height = 150
  const { project } = chartFrame([maxes, mins], width, height, 16)
  const hi = project(maxes)
  const lo = project(mins)
  const band = `${linePath(hi)} ${[...lo].reverse().map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="بازه دمای هفت روز">
      <path d={band} fill="rgba(46,230,199,.16)" />
      <path d={linePath(hi)} fill="none" stroke="#e8a06a" strokeWidth="2.2" />
      <path d={linePath(lo)} fill="none" stroke="#8ecbff" strokeWidth="2.2" />
    </svg>
  )
}
