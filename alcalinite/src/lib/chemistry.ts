import type { WaterSample } from '../types'

/** 1 °f = 10 mg/L CaCO₃ = 0,2 meq/L d’alcalinité. */
export const MEQ_PER_DEGREE_F = 0.2

/** Masse équivalente de HCO₃⁻. */
export const HCO3_MG_PER_MEQ = 61

/** 1 °f ≈ 12,2 mg/L de HCO₃⁻. */
export const HCO3_MG_PER_DEGREE_F = 12.2

/**
 * Concentrations d’échantillon en mmol/L (= meq/L pour OH⁻ et HCO₃⁻).
 * TA = [OH⁻] + [CO₃²⁻]
 * TAC = [OH⁻] + 2[CO₃²⁻] + [HCO₃⁻]
 */
export function taMeq(w: Pick<WaterSample, 'oh' | 'co3'>): number {
  return w.oh + w.co3
}

export function tacMeq(w: Pick<WaterSample, 'oh' | 'co3' | 'hco3'>): number {
  return w.oh + 2 * w.co3 + w.hco3
}

export function toDegreeF(meqPerL: number): number {
  return meqPerL / MEQ_PER_DEGREE_F
}

export function toMgLCaCO3(degreeF: number): number {
  return degreeF * 10
}

/** [HCO₃⁻] meq/L → mg/L (masse équivalente 61 mg/meq). */
export function hco3MeqToMgL(meqPerL: number): number {
  return meqPerL * HCO3_MG_PER_MEQ
}

/** mg/L HCO₃⁻ → °f (1 °f ≈ 12,2 mg/L HCO₃⁻). */
export function hco3MgLToDegreeF(mgPerL: number): number {
  return mgPerL / HCO3_MG_PER_DEGREE_F
}

/**
 * Titration : OH⁻ puis CO₃²⁻ → HCO₃⁻ puis HCO₃⁻ → CO₂.
 * Virages pédagogiques : pH ≈ 8,3 (TA) puis pH ≈ 4,3 (TAC).
 */
export function titrate(sample: WaterSample, acidMeqAdded: number) {
  let oh = sample.oh
  let co3 = sample.co3
  let hco3 = sample.hco3
  let remaining = Math.max(0, acidMeqAdded)

  const take = (pool: number) => {
    const used = Math.min(pool, remaining)
    remaining -= used
    return pool - used
  }

  oh = take(oh)
  const fromCo3 = Math.min(co3, remaining)
  co3 -= fromCo3
  hco3 += fromCo3
  remaining -= fromCo3
  hco3 = take(hco3)

  const excess = remaining
  const taLeft = oh + co3
  const tacLeft = oh + 2 * co3 + hco3
  const ph = estimatePh({ oh, co3, hco3, excess, taLeft })

  return { oh, co3, hco3, excess, taLeft, tacLeft, ph }
}

function estimatePh(args: {
  oh: number
  co3: number
  hco3: number
  excess: number
  taLeft: number
}): number {
  const { oh, co3, hco3, excess, taLeft } = args

  if (excess > 0.01) {
    return Math.max(2.8, 4.3 - excess * 2.2)
  }

  if (taLeft > 0.05) {
    if (oh > 0.05) {
      return Math.min(12.8, 10.8 + Math.log10(1 + oh * 6))
    }
    const frac = co3 / (co3 + hco3 + 1e-6)
    return 8.3 + frac * 2.1
  }

  // Seulement HCO₃⁻ : de ~8,3 (juste après TA) à ~4,3 (TAC)
  if (hco3 > 0.05) {
    return 4.3 + Math.min(4.0, hco3 * 2.5)
  }

  return 4.3
}

export function phenolColor(ph: number): string {
  if (ph >= 8.5) return 'rgba(232, 96, 160, 0.55)'
  if (ph >= 8.15) return 'rgba(232, 96, 160, 0.22)'
  return 'rgba(245, 250, 252, 0.12)'
}

export function methylColor(ph: number): string {
  if (ph >= 4.6) return 'rgba(240, 198, 72, 0.45)'
  if (ph >= 4.15) return 'rgba(232, 140, 64, 0.5)'
  return 'rgba(214, 72, 64, 0.55)'
}

export function near(value: number, target: number, tol = 0.35): boolean {
  return Math.abs(value - target) <= tol
}

export function atTaEndpoint(acidMeq: number, sample: WaterSample): boolean {
  return near(titrate(sample, acidMeq).ph, 8.3, 0.45)
}

/** Virage hélianthine : pH environ 4,3 (fenêtre pédagogique). */
export function atTacEndpoint(acidMeq: number, sample: WaterSample): boolean {
  const { ph } = titrate(sample, acidMeq)
  return ph >= 3.9 && ph <= 4.75
}
