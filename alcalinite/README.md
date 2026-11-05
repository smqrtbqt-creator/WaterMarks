# Alcalinité · TA / TAC

Laboratoire interactif (sans quiz) : pH, basicité, alcalinité, dosages TA/TAC dans une station d’eau potable.

## Stack

React 19 · Vite · TypeScript · Zustand · Framer Motion · SVG · XState

## Local

```bash
cd alcalinite
npm install
npm run dev
```

- TA / TAC : http://127.0.0.1:5175/alcalinite/
- Dosage CO₂ (eaux BRGM Gironde) : http://127.0.0.1:5175/alcalinite/co2
- Filière forage (équilibre calco-carbonique et chlore) : http://127.0.0.1:5175/alcalinite/equilibre

## Build

```bash
npm run build
```

Sortie : `../static/alcalinite/` → servie sous `/alcalinite/`.
