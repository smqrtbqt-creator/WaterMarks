/** Teinte d’eau façon Waterstation — pilotée par le TAC (°f) et le pH. */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function mix(a: number[], b: number[], k: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * k)
  const g = Math.round(a[1] + (b[1] - a[1]) * k)
  const bl = Math.round(a[2] + (b[2] - a[2]) * k)
  return `rgb(${r} ${g} ${bl})`
}

/**
 * TAC bas → eau claire cyan ; TAC élevé → teinte plus soutenue (réserve alcaline).
 * Référence visuelle proche de turbidityColor (clair → ambré).
 */
export function tacWaterColor(tacDegreeF: number): string {
  const t = clamp(tacDegreeF / 28, 0, 1)
  const clear = [126, 206, 214]
  const mid = [96, 168, 186]
  const rich = [72, 128, 158]
  if (t < 0.45) return mix(clear, mid, t / 0.45)
  return mix(mid, rich, (t - 0.45) / 0.55)
}

/**
 * Après injection CO₂ : le pH baisse → légère dérive vers le jaune-vert
 * (eau plus « acidifiée »), sans changer le TAC.
 */
export function treatedWaterColor(tacDegreeF: number, ph: number): string {
  const base = tacWaterColor(tacDegreeF)
  const acid = clamp((7.6 - ph) / 1.6, 0, 1)
  if (acid < 0.05) return base
  const match = base.match(/rgb\((\d+) (\d+) (\d+)\)/)
  if (!match) return base
  const r = Math.round(Number(match[1]) + acid * 36)
  const g = Math.round(Number(match[2]) + acid * 18)
  const b = Math.round(Number(match[3]) - acid * 28)
  return `rgb(${clamp(r, 0, 255)} ${clamp(g, 0, 255)} ${clamp(b, 0, 255)})`
}

export function pipeStroke(color: string, alpha = 0.95): string {
  const match = color.match(/rgb\((\d+) (\d+) (\d+)\)/)
  if (!match) return color
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
}
