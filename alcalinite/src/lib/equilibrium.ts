/** Modèle pédagogique carbonate + chlore. Ce n’est pas un calcul de saturation. */

export const HOCL_PKA = 7.5
export const MM_CO2 = 44
export const MM_CA = 40.08

export type EquilibriumInput = {
  phRaw: number
  tacMmol: number
  caMgL: number
  tempC: number
  co2MgL: number
  /** 0 à 1 : part du CO₂ dissous qui réagit avec CaCO₃. */
  contact: number
  chlorineDoseMgL: number
  chlorineDemandMgL: number
  contactMin: number
}

export type WaterPoint = {
  ph: number
  tacMmol: number
  ctMmol: number
  h2co3Mmol: number
  hco3Mmol: number
  co3Mmol: number
  caMgL: number
}

export type ChlorineSplit = {
  ratio: number
  fHocl: number
  fOcl: number
}

export type EquilibriumResult = {
  pK1: number
  pK2: number
  pKw: number
  raw: WaterPoint
  afterCo2: WaterPoint
  afterContact: WaterPoint
  dissolvedMmol: number
  chlorine: ChlorineSplit & {
    ph: number
    residualMgL: number
    hoclMgL: number
    oclMgL: number
    at68: ChlorineSplit
    at78: ChlorineSplit
  }
}

export const SUBJECT: EquilibriumInput = {
  phRaw: 7.8,
  tacMmol: 3,
  caMgL: 60,
  tempC: 15,
  co2MgL: 0,
  contact: 0,
  chlorineDoseMgL: 0.8,
  chlorineDemandMgL: 0.3,
  contactMin: 30,
}

type Consts = { k1: number; k2: number; kw: number; pK1: number; pK2: number; pKw: number }

export function carbonateConstants(tempC: number): Consts {
  const d = 25 - tempC
  const pK1 = 6.35 + 0.007 * d
  const pK2 = 10.33 + 0.01 * d
  const pKw = 14 + 0.033 * d
  return { pK1, pK2, pKw, k1: 10 ** -pK1, k2: 10 ** -pK2, kw: 10 ** -pKw }
}

function alphas(h: number, k1: number, k2: number) {
  const d = h * h + k1 * h + k1 * k2
  return { a0: (h * h) / d, a1: (k1 * h) / d, a2: (k1 * k2) / d }
}

function alkalinity(ctMol: number, h: number, c: Consts) {
  const { a1, a2 } = alphas(h, c.k1, c.k2)
  return ctMol * (a1 + 2 * a2) + c.kw / h - h
}

function ctMolFrom(ph: number, tacMmol: number, c: Consts) {
  const h = 10 ** -ph
  const { a1, a2 } = alphas(h, c.k1, c.k2)
  const denom = a1 + 2 * a2
  const alk = tacMmol / 1000
  return Math.max((alk - c.kw / h + h) / denom, 1e-8)
}

function phFrom(ctMol: number, tacMmol: number, c: Consts) {
  const alk = tacMmol / 1000
  let lo = 4.5
  let hi = 10.5
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const pred = alkalinity(ctMol, 10 ** -mid, c)
    if (pred > alk) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

function point(ph: number, tacMmol: number, ctMol: number, caMgL: number, c: Consts): WaterPoint {
  const { a0, a1, a2 } = alphas(10 ** -ph, c.k1, c.k2)
  return {
    ph,
    tacMmol,
    ctMmol: ctMol * 1000,
    h2co3Mmol: ctMol * a0 * 1000,
    hco3Mmol: ctMol * a1 * 1000,
    co3Mmol: ctMol * a2 * 1000,
    caMgL,
  }
}

export function chlorineSplit(ph: number): ChlorineSplit {
  const ratio = 10 ** (ph - HOCL_PKA)
  const fHocl = 1 / (1 + ratio)
  return { ratio, fHocl, fOcl: 1 - fHocl }
}

export function evaluate(input: EquilibriumInput): EquilibriumResult {
  const c = carbonateConstants(input.tempC)
  const tac = Math.max(0.05, input.tacMmol)
  const ca = Math.max(0, input.caMgL)
  const ct0 = ctMolFrom(input.phRaw, tac, c)
  const raw = point(input.phRaw, tac, ct0, ca, c)

  const ct1 = ct0 + Math.max(0, input.co2MgL) / (MM_CO2 * 1000)
  const ph1 = phFrom(ct1, tac, c)
  const afterCo2 = point(ph1, tac, ct1, ca, c)

  const contact = Math.min(1, Math.max(0, input.contact))
  const dissolvedMol = contact * (afterCo2.h2co3Mmol / 1000)
  const tac2 = tac + 2 * dissolvedMol * 1000
  const ct2 = ct1 + dissolvedMol
  const ca2 = ca + dissolvedMol * 1000 * MM_CA
  const ph2 = phFrom(ct2, tac2, c)
  const afterContact = point(ph2, tac2, ct2, ca2, c)

  const split = chlorineSplit(afterContact.ph)
  const residual = Math.max(0, input.chlorineDoseMgL - input.chlorineDemandMgL)

  return {
    pK1: c.pK1,
    pK2: c.pK2,
    pKw: c.pKw,
    raw,
    afterCo2,
    afterContact,
    dissolvedMmol: dissolvedMol * 1000,
    chlorine: {
      ...split,
      ph: afterContact.ph,
      residualMgL: residual,
      hoclMgL: residual * split.fHocl,
      oclMgL: residual * split.fOcl,
      at68: chlorineSplit(6.8),
      at78: chlorineSplit(7.8),
    },
  }
}

/** Dose de CO₂ (mg/L) qui amène le pH vers la cible, sans dissolution de calcaire. */
export function co2MgLForPh(input: EquilibriumInput, targetPh: number): number {
  const at = (co2MgL: number) => evaluate({ ...input, co2MgL, contact: 0 }).afterCo2.ph
  if (at(0) <= targetPh) return 0
  let lo = 0
  let hi = 200
  if (at(hi) > targetPh) return hi
  for (let i = 0; i < 42; i++) {
    const mid = (lo + hi) / 2
    if (at(mid) > targetPh) lo = mid
    else hi = mid
  }
  return hi
}

export type Tendency = 'agression' | 'incrustation' | 'partage'

/** Sens illustratif. Ce n’est pas un indice de saturation. */
export function tendency(point: WaterPoint): Tendency {
  const low = (point.ph <= 7.2 ? 1 : 0) + (point.tacMmol <= 1.5 ? 1 : 0) + (point.caMgL <= 40 ? 1 : 0)
  const high = (point.ph >= 8.2 ? 1 : 0) + (point.tacMmol >= 4.5 ? 1 : 0) + (point.caMgL >= 150 ? 1 : 0)
  if (low >= 2 && high === 0) return 'agression'
  if (high >= 2 && low === 0) return 'incrustation'
  return 'partage'
}
