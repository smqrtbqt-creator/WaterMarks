export type ElementSymbol = 'Fe' | 'Cu' | 'O' | 'H' | 'Mn' | 'Cl'

export type SceneAtom = {
  el: ElementSymbol
  x: number
  y: number
}

export type SceneMolecule = {
  id: string
  formula: string
  hint: string
  state: 'active' | 'forming' | 'spent'
  atoms: SceneAtom[]
  bonds: { a: number; b: number; double?: boolean }[]
  loose: number
  caught: number
  accepts: boolean
  /** Carte qui porte des électrons écrits dans la demi-équation, sans atome. */
  kind?: 'electrons'
  /** Atome de la molécule sur lequel l’électron est posé. */
  electronHost?: number
}

const CENTER = { x: 70, y: 46 }

function one(el: ElementSymbol): SceneAtom[] {
  return [{ el, ...CENTER }]
}

function pair(el: ElementSymbol): SceneAtom[] {
  return [
    { el, x: 46, y: 46 },
    { el, x: 94, y: 46 },
  ]
}

function waterAtoms(): SceneAtom[] {
  return [
    { el: 'H', x: 30, y: 66 },
    { el: 'O', x: 70, y: 38 },
    { el: 'H', x: 110, y: 66 },
  ]
}

function dioxide(metal: ElementSymbol): SceneAtom[] {
  return [
    { el: 'O', x: 28, y: 46 },
    { el: metal, x: 70, y: 46 },
    { el: 'O', x: 112, y: 46 },
  ]
}

function molecule(
  id: string,
  formula: string,
  hint: string,
  atoms: SceneAtom[],
  bonds: SceneMolecule['bonds'],
  extra: Partial<Pick<SceneMolecule, 'state' | 'loose' | 'caught' | 'accepts' | 'kind' | 'electronHost'>> = {},
): SceneMolecule {
  return {
    id,
    formula,
    hint,
    atoms,
    bonds,
    state: extra.state ?? 'active',
    loose: extra.loose ?? 0,
    caught: extra.caught ?? 0,
    accepts: extra.accepts ?? false,
    kind: extra.kind,
    electronHost: extra.electronHost,
  }
}

function aeration(moved: number): { reactants: SceneMolecule[]; products: SceneMolecule[] } {
  const done = moved === 4
  return {
    reactants: [
      ...[0, 1, 2, 3].map((index) =>
        molecule(`fe-${index}`, index < moved ? 'Fe³⁺' : 'Fe²⁺', index < moved ? 'électron perdu' : 'réducteur', one('Fe'), [], {
          loose: index < moved ? 0 : 1,
          state: index < moved ? 'spent' : 'active',
        }),
      ),
      molecule('o2', 'O₂', done ? 'a réagi' : 'oxydant', pair('O'), [{ a: 0, b: 1, double: true }], {
        caught: done ? 0 : moved,
        accepts: true,
        state: done ? 'spent' : 'active',
      }),
      ...[0, 1, 2, 3].map((index) =>
        molecule(`h-${index}`, 'H⁺', done ? 'a réagi' : 'dans l’équation', one('H'), [], { state: done ? 'spent' : 'active' }),
      ),
    ],
    products: [
      ...[0, 1, 2, 3].map((index) =>
        molecule(`pfe-${index}`, 'Fe³⁺', index < moved ? 'formé' : 'pas encore', one('Fe'), [], {
          state: index < moved ? 'active' : 'forming',
        }),
      ),
      ...[0, 1].map((index) =>
        molecule(`eau-${index}`, 'H₂O', done ? 'formé' : 'pas encore', waterAtoms(), [
          { a: 0, b: 1 },
          { a: 1, b: 2 },
        ], { state: done ? 'active' : 'forming' }),
      ),
    ],
  }
}

export type LessonRow = {
  id: string
  label: string
  equation: string
  state: 'done' | 'now' | 'wait'
}

export type ManganeseLesson = {
  phaseLabel: string
  title: string
  note: string
  leftTitle: string
  rightTitle: string
  rows: LessonRow[]
  reactants: SceneMolecule[]
  products: SceneMolecule[]
  mode: 'tear' | 'next' | 'capture' | 'done'
  nextLabel?: string
}

const OX = 'Mn²⁺ + 2 H₂O → MnO₂ + 4 H⁺ + 2 e⁻'
const OX2 = '2 Mn²⁺ + 4 H₂O → 2 MnO₂ + 8 H⁺ + 4 e⁻'
const RED = 'O₂ + 4 e⁻ ⇌ 2 O²⁻'
const RED2 = '2 O²⁻ + 8 H⁺ → 2 H₂O + 4 H⁺'
const NET = '2 Mn²⁺ + O₂ + 2 H₂O → 2 MnO₂ + 4 H⁺'

function row(id: string, label: string, equation: string, state: LessonRow['state']): LessonRow {
  return { id, label, equation, state }
}

function waters(prefix: string, hint: string, state: SceneMolecule['state'] = 'active'): SceneMolecule[] {
  return [0, 1].map((index) =>
    molecule(`${prefix}-w-${index}`, 'H₂O', hint, waterAtoms(), [
      { a: 0, b: 1 },
      { a: 1, b: 2 },
    ], { state }),
  )
}

function protons(prefix: string, count: number, hint: string, state: SceneMolecule['state']): SceneMolecule[] {
  return Array.from({ length: count }, (_, index) =>
    molecule(`${prefix}-h-${index}`, 'H⁺', hint, one('H'), [], { state }),
  )
}

function waterBonds(): { a: number; b: number }[] {
  return [
    { a: 0, b: 1 },
    { a: 1, b: 2 },
  ]
}

function chargedWater(id: string): SceneMolecule {
  return molecule(id, 'H₂O', '2 électrons sur l’oxygène', waterAtoms(), waterBonds(), { loose: 2, electronHost: 1 })
}

function halfWater(id: string): SceneMolecule {
  return molecule(id, 'H–O', 'il reste 1 électron sur cette eau', [
    { el: 'O', x: 46, y: 50 },
    { el: 'H', x: 98, y: 50 },
  ], [{ a: 0, b: 1 }], { loose: 1, electronHost: 0 })
}

function quietWater(id: string): SceneMolecule {
  return molecule(id, 'H₂O', 'ensuite, 2 électrons aussi', waterAtoms(), waterBonds())
}

function manganeseWithOxygen(id: string, arrived: boolean): SceneMolecule {
  if (!arrived) return molecule(id, 'Mn²⁺', 'attend les oxygènes', one('Mn'), [])
  return molecule(id, 'Mn–O', 'l’oxygène de la première eau est arrivé', [
    { el: 'Mn', x: 46, y: 48 },
    { el: 'O', x: 100, y: 48 },
  ], [{ a: 0, b: 1 }])
}

function tearingBench(stage: number, key: string): Pick<ManganeseLesson, 'reactants' | 'products'> {
  const firstDone = stage >= 2
  const secondStarted = stage >= 2
  const reactants = [
    manganeseWithOxygen(`${key}-mn`, firstDone),
    firstDone ? null : stage === 0 ? chargedWater(`${key}-w0`) : halfWater(`${key}-w0`),
    secondStarted ? (stage === 2 ? chargedWater(`${key}-w1`) : halfWater(`${key}-w1`)) : quietWater(`${key}-w1`),
  ].filter((item): item is SceneMolecule => item !== null)
  return {
    reactants,
    products: Array.from({ length: stage }, (_, index) =>
      molecule(`${key}-h-${index}`, 'H⁺', 'apparu quand l’électron a été arraché', one('H'), []),
    ),
  }
}

function formedBench(key: string): Pick<ManganeseLesson, 'reactants' | 'products'> {
  return {
    reactants: [
      molecule(`${key}-mno2`, 'MnO₂', 'les oxygènes de l’eau sont arrivés', dioxide('Mn'), [
        { a: 0, b: 1 },
        { a: 1, b: 2 },
      ]),
    ],
    products: protons(key, 4, 'libérés par les eaux cassées', 'active'),
  }
}

const TEAR_NOTES = [
  'Cette molécule d’eau porte 2 électrons. Arrache le premier : un H⁺ apparaît.',
  'Il reste 1 électron sur cette même eau. Arrache-le : elle se casse, et son oxygène va vers Mn²⁺.',
  'La seconde eau a aussi 2 électrons. Arrache le premier : un H⁺ apparaît.',
  'Dernier électron de cette eau. Quand il part, elle se casse et le second oxygène complète MnO₂.',
]

export function manganeseLesson(moved: number, placed: number): ManganeseLesson {
  if (moved < 4) {
    return {
      phaseLabel: 'étape 1/4',
      title: 'Demi-équation d’oxydation',
      note: TEAR_NOTES[moved],
      leftTitle: 'Mn²⁺ et les molécules d’eau',
      rightTitle: 'H⁺ apparu',
      rows: [
        row('ox', 'Oxydation', OX, 'now'),
        row('ox2', 'Oxydation × 2', OX2, 'wait'),
        row('red', 'Réduction, 1', RED, 'wait'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      ...tearingBench(moved, 'ox1'),
      mode: 'tear',
    }
  }
  if (moved === 4) {
    return {
      phaseLabel: 'étape 1/4',
      title: 'Les deux eaux ont cédé leurs électrons',
      note: 'Chaque eau a perdu 2 électrons. À chaque électron, un H⁺ est apparu. Les deux oxygènes sont maintenant sur Mn²⁺ : c’est MnO₂.',
      leftTitle: 'Oxygènes arrivés sur Mn²⁺',
      rightTitle: 'H⁺ libérés',
      nextLabel: 'Oxydation du second Mn²⁺',
      rows: [
        row('ox', 'Oxydation', OX, 'now'),
        row('ox2', 'Oxydation × 2', OX2, 'wait'),
        row('red', 'Réduction, 1', RED, 'wait'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      ...formedBench('ox1'),
      mode: 'next',
    }
  }
  if (moved < 9) {
    const stage = moved - 5
    return {
      phaseLabel: 'étape 2/4',
      title: 'La même oxydation, pour le second Mn²⁺',
      note: TEAR_NOTES[stage],
      leftTitle: 'Mn²⁺ et les molécules d’eau',
      rightTitle: 'H⁺ apparu',
      rows: [
        row('ox', 'Oxydation, 1er ion', OX, 'done'),
        row('oxb', 'Oxydation, 2e ion', OX, 'now'),
        row('ox2', 'Oxydation × 2', OX2, 'wait'),
        row('red', 'Réduction, 1', RED, 'wait'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      ...tearingBench(stage, 'ox2'),
      mode: 'tear',
    }
  }
  if (moved === 9) {
    return {
      phaseLabel: 'étape 2/4',
      title: 'Le second Mn²⁺ a reçu ses oxygènes',
      note: 'Chaque molécule d’eau a perdu 2 électrons, et MnO₂ est formé. On peut maintenant écrire l’oxydation deux fois.',
      leftTitle: 'Oxygènes arrivés sur Mn²⁺',
      rightTitle: 'H⁺ libérés',
      nextLabel: 'Écrire l’oxydation deux fois',
      rows: [
        row('ox', 'Oxydation, 1er ion', OX, 'done'),
        row('oxb', 'Oxydation, 2e ion', OX, 'done'),
        row('ox2', 'Oxydation × 2', OX2, 'wait'),
        row('red', 'Réduction, 1', RED, 'wait'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      ...formedBench('ox2'),
      mode: 'next',
    }
  }
  if (moved === 10) {
    return {
      phaseLabel: 'étape 3/4',
      title: 'On écrit l’oxydation deux fois',
      note: 'Deux ions Mn²⁺ ont perdu 4 électrons en tout. On additionne les deux demi-équations d’oxydation.',
      leftTitle: 'Réactifs additionnés',
      rightTitle: 'Produits additionnés',
      rows: [
        row('ox', 'Oxydation', OX, 'done'),
        row('ox2', 'Oxydation × 2', OX2, 'now'),
        row('red', 'Réduction, 1', RED, 'wait'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      reactants: [
        ...[0, 1].map((index) => molecule(`sum-mn-${index}`, 'Mn²⁺', 'déjà oxydé', one('Mn'), [], { state: 'spent' })),
        ...waters('sum', 'déjà entrées', 'spent'),
        ...waters('sumb', 'déjà entrées', 'spent'),
      ],
      products: [
        ...[0, 1].map((index) =>
          molecule(`sum-mno2-${index}`, 'MnO₂', 'formé', dioxide('Mn'), [
            { a: 0, b: 1 },
            { a: 1, b: 2 },
          ]),
        ),
        ...protons('sum', 8, 'formés', 'active'),
        molecule('sum-e', '4 e⁻', 'à donner à O₂', [], [], { caught: 4, kind: 'electrons' }),
      ],
      nextLabel: 'Écrire la réduction',
      mode: 'next',
    }
  }
  if (moved === 11) {
    const left = 4 - placed
    return {
      phaseLabel: 'réduction 1/2',
      title: 'O₂ prend les 4 électrons',
      note: 'On écrit d’abord O₂ + 4 e⁻ ⇌ 2 O²⁻. Les 8 H⁺ produits par l’oxydation sont là, ils attendent la ligne suivante.',
      leftTitle: 'O₂ et les 4 électrons',
      rightTitle: '2 O²⁻, et les 8 H⁺ déjà formés',
      rows: [
        row('ox2', 'Oxydation × 2', OX2, 'done'),
        row('red', 'Réduction, 1', RED, 'now'),
        row('red2', 'Réduction, 2', RED2, 'wait'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      reactants: [
        molecule('red-o2', 'O₂', 'oxydant', pair('O'), [{ a: 0, b: 1, double: true }], {
          caught: placed,
          accepts: true,
        }),
        molecule('red-e', 'e⁻', 'venus de l’oxydation', [], [], { loose: left, kind: 'electrons' }),
      ],
      products: [
        ...[0, 1].map((index) =>
          molecule(`ox-${index}`, 'O²⁻', placed === 4 ? 'formé' : 'pas encore', one('O'), [], {
            state: placed === 4 ? 'active' : 'forming',
          }),
        ),
        ...protons('wait', 8, 'générés avant', 'active'),
      ],
      mode: 'capture',
    }
  }
  if (moved === 12) {
    return {
      phaseLabel: 'réduction 2/2',
      title: 'Les ions O²⁻ rencontrent les 8 H⁺',
      note: 'Les 2 O²⁻ réagissent avec les 8 hydrogènes produits par l’oxydation. Il se forme 2 H₂O, et 4 H⁺ restent.',
      leftTitle: '2 O²⁻ et les 8 H⁺',
      rightTitle: 'Fin de la réduction',
      nextLabel: 'Écrire le bilan',
      rows: [
        row('ox2', 'Oxydation × 2', OX2, 'done'),
        row('red', 'Réduction, 1', RED, 'done'),
        row('red2', 'Réduction, 2', RED2, 'now'),
        row('net', 'Bilan', NET, 'wait'),
      ],
      reactants: [
        ...[0, 1].map((index) => molecule(`ox-${index}`, 'O²⁻', 'venu de O₂', one('O'), [])),
        ...protons('in', 8, 'générés par l’oxydation', 'active'),
      ],
      products: [
        ...waters('out', 'formé'),
        ...protons('left', 4, 'il en reste 4', 'active'),
      ],
      mode: 'next',
    }
  }
  return {
    phaseLabel: 'réglé',
    title: 'Bilan des deux demi-équations',
    note: 'L’oxydation × 2, puis O₂ + 4 e⁻ ⇌ 2 O²⁻, puis 2 O²⁻ + 8 H⁺ → 2 H₂O + 4 H⁺. Les électrons et les ions O²⁻ s’annulent. Il reste 2 Mn²⁺ + O₂ + 2 H₂O → 2 MnO₂ + 4 H⁺.',
    leftTitle: 'Ce qui reste à gauche',
    rightTitle: 'Ce qui reste à droite',
    rows: [
      row('ox2', 'Oxydation × 2', OX2, 'done'),
      row('red', 'Réduction, 1', RED, 'done'),
      row('red2', 'Réduction, 2', RED2, 'done'),
      row('net', 'Bilan', NET, 'now'),
    ],
    reactants: [
      ...[0, 1].map((index) => molecule(`net-mn-${index}`, 'Mn²⁺', 'réducteur', one('Mn'), [], { state: 'spent' })),
      molecule('net-o2', 'O₂', 'oxydant', pair('O'), [{ a: 0, b: 1, double: true }], { state: 'spent' }),
      ...waters('net', 'dans le bilan', 'spent'),
    ],
    products: [
      ...[0, 1].map((index) =>
        molecule(`net-mno2-${index}`, 'MnO₂', 'produit', dioxide('Mn'), [
          { a: 0, b: 1 },
          { a: 1, b: 2 },
        ]),
      ),
      ...protons('net', 4, 'il en reste 4', 'active'),
    ],
    mode: 'done',
  }
}

export function manganesePhaseLabel(moved: number): string {
  return manganeseLesson(moved, 0).phaseLabel
}

function chlorine(moved: number): { reactants: SceneMolecule[]; products: SceneMolecule[] } {
  const done = moved === 2
  return {
    reactants: [
      ...[0, 1].map((index) =>
        molecule(`fe-${index}`, index < moved ? 'Fe³⁺' : 'Fe²⁺', index < moved ? 'électron perdu' : 'réducteur', one('Fe'), [], {
          loose: index < moved ? 0 : 1,
          state: index < moved ? 'spent' : 'active',
        }),
      ),
      molecule('cl2', 'Cl₂', done ? 'a réagi' : 'oxydant', pair('Cl'), [{ a: 0, b: 1 }], {
        caught: done ? 0 : moved,
        accepts: true,
        state: done ? 'spent' : 'active',
      }),
    ],
    products: [
      ...[0, 1].map((index) =>
        molecule(`pfe-${index}`, 'Fe³⁺', index < moved ? 'formé' : 'pas encore', one('Fe'), [], {
          state: index < moved ? 'active' : 'forming',
        }),
      ),
      ...[0, 1].map((index) =>
        molecule(`cl-${index}`, 'Cl⁻', done ? 'formé' : 'pas encore', one('Cl'), [], {
          caught: done ? 1 : 0,
          state: done ? 'active' : 'forming',
        }),
      ),
    ],
  }
}

function bench(moved: number): { reactants: SceneMolecule[]; products: SceneMolecule[] } {
  const done = moved === 2
  const iron = moved === 0 ? 'Fe' : moved === 1 ? 'Fe⁺' : 'Fe²⁺'
  const copper = moved === 0 ? 'Cu²⁺' : moved === 1 ? 'Cu⁺' : 'Cu'
  return {
    reactants: [
      molecule('fe', iron, done ? 'électrons perdus' : 'réducteur', one('Fe'), [], {
        loose: 2 - moved,
        state: done ? 'spent' : 'active',
      }),
      molecule('cu', copper, done ? 'électrons captés' : 'oxydant', one('Cu'), [], {
        caught: done ? 0 : moved,
        accepts: true,
        state: done ? 'spent' : 'active',
      }),
    ],
    products: [
      molecule('pfe', 'Fe²⁺', done ? 'formé' : 'pas encore', one('Fe'), [], { state: done ? 'active' : 'forming' }),
      molecule('pcu', 'Cu', done ? 'formé' : 'pas encore', one('Cu'), [], { state: done ? 'active' : 'forming' }),
    ],
  }
}

export function sceneFor(stationId: string, moved: number): { reactants: SceneMolecule[]; products: SceneMolecule[] } {
  if (stationId === 'aeration') return aeration(moved)
  if (stationId === 'manganese') {
    const lesson = manganeseLesson(moved, 0)
    return { reactants: lesson.reactants, products: lesson.products }
  }
  if (stationId === 'chlore') return chlorine(moved)
  return bench(moved)
}
