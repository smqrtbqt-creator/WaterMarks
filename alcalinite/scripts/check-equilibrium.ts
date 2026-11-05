import assert from 'node:assert/strict'
import { chlorineSplit, co2MgLForPh, evaluate, SUBJECT } from '../src/lib/equilibrium.ts'

const base = evaluate(SUBJECT)
assert.ok(Math.abs(base.afterCo2.ph - 7.8) < 0.02, `pH brut ${base.afterCo2.ph}`)
assert.ok(Math.abs(base.raw.tacMmol - 3) < 1e-9)
assert.equal(base.dissolvedMmol, 0)
assert.ok(base.raw.hco3Mmol > 0.8 * base.raw.ctMmol)

const c68 = chlorineSplit(6.8)
assert.ok(Math.abs(c68.ratio - 10 ** -0.7) < 1e-9)
assert.ok(Math.abs(c68.fHocl - 1 / (1 + 10 ** -0.7)) < 1e-9)

const c78 = chlorineSplit(7.8)
assert.ok(Math.abs(c78.ratio - 10 ** 0.3) < 1e-9)
assert.ok(Math.abs(c78.fHocl - 1 / (1 + 10 ** 0.3)) < 1e-9)
assert.ok(c68.fHocl > c78.fHocl)

const dose = co2MgLForPh(SUBJECT, 6.8)
const dropped = evaluate({ ...SUBJECT, co2MgL: dose, contact: 0 })
assert.ok(Math.abs(dropped.afterCo2.ph - 6.8) < 0.03, `pH CO2 ${dropped.afterCo2.ph}`)
assert.ok(Math.abs(dropped.afterCo2.tacMmol - 3) < 1e-6)
assert.ok(Math.abs(dropped.afterCo2.caMgL - 60) < 1e-6)
assert.ok(dropped.afterCo2.h2co3Mmol > base.raw.h2co3Mmol)

const contacted = evaluate({ ...SUBJECT, co2MgL: dose, contact: 1 })
assert.ok(contacted.dissolvedMmol > 0.2)
assert.ok(contacted.afterContact.tacMmol > dropped.afterCo2.tacMmol + 0.3)
assert.ok(contacted.afterContact.caMgL > 60 + 5)
assert.ok(contacted.afterContact.hco3Mmol > dropped.afterCo2.hco3Mmol)
assert.ok(contacted.afterContact.ph > dropped.afterCo2.ph + 0.5)

const none = evaluate({ ...SUBJECT, chlorineDoseMgL: 0.4, chlorineDemandMgL: 0.9 })
assert.equal(none.chlorine.residualMgL, 0)
assert.equal(none.chlorine.hoclMgL, 0)

const some = evaluate({ ...SUBJECT, chlorineDoseMgL: 1, chlorineDemandMgL: 0.25 })
assert.ok(Math.abs(some.chlorine.residualMgL - 0.75) < 1e-9)
assert.ok(Math.abs(some.chlorine.hoclMgL + some.chlorine.oclMgL - 0.75) < 1e-9)

console.log(
  'check-equilibrium: ok',
  JSON.stringify({
    doseMgL: Number(dose.toFixed(1)),
    phContact: Number(contacted.afterContact.ph.toFixed(2)),
    tac: Number(contacted.afterContact.tacMmol.toFixed(2)),
    ca: Number(contacted.afterContact.caMgL.toFixed(1)),
  }),
)
