import type { BrgmForage } from '../data/brgmForages'
import { pipeStroke, tacWaterColor, treatedWaterColor } from '../lib/waterTint'

type Props = {
  forage: BrgmForage
  ph: number
  co2MgL: number
  running?: boolean
}

export function Co2FlowPlant({ forage, ph, co2MgL, running = true }: Props) {
  const raw = tacWaterColor(forage.tacDegreeF)
  const treated = treatedWaterColor(forage.tacDegreeF, ph)
  const mid = treatedWaterColor(forage.tacDegreeF, (forage.ph + ph) / 2)
  const rawStroke = pipeStroke(raw)
  const midStroke = pipeStroke(mid)
  const treatedStroke = pipeStroke(treated)
  const bubbling = co2MgL > 0.5 && running

  return (
    <div className={`co2-plant${running ? ' is-running' : ''}`} role="img" aria-label="Synoptique dosage CO₂">
      <svg className="co2-plant-svg" viewBox="0 0 1040 340" aria-hidden>
        <defs>
          <pattern id="plant-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(186,214,210,0.14)" />
          </pattern>
          <linearGradient id="raw-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={raw} stopOpacity="0.35" />
            <stop offset="100%" stopColor={raw} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="mix-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={raw} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={treated} />
          </linearGradient>
          <linearGradient id="out-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={treated} stopOpacity="0.35" />
            <stop offset="100%" stopColor={treated} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <rect width="1040" height="340" fill="url(#plant-dots)" rx="16" />

        {/* 1. Arrivée forage */}
        <g className="unit">
          <rect x="16" y="100" width="100" height="130" rx="12" fill="#0c1c22" stroke="rgba(196,224,220,0.35)" />
          <rect x="28" y="138" width="76" height="72" rx="8" fill="url(#raw-fill)" />
          <text x="66" y="88" textAnchor="middle" fill="#93aeb0" fontSize="11">
            1 · Forage
          </text>
          <text x="66" y="128" textAnchor="middle" fill="#e8f3f1" fontSize="11">
            {forage.label}
          </text>
          <text x="66" y="178" textAnchor="middle" fill="#102018" fontSize="12" fontWeight="600">
            pH {forage.ph.toFixed(2)}
          </text>
          <text x="66" y="248" textAnchor="middle" fill="#8ec8e6" fontSize="10" fontFamily="IBM Plex Mono, monospace">
            TAC {forage.tacDegreeF.toFixed(0)} °f
          </text>
        </g>

        <path className="stream" d="M116 170 H168" stroke={rawStroke} strokeWidth="14" strokeLinecap="round" />
        <path className="stream-dash" d="M116 170 H168" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeDasharray="10 14" />

        {/* 2. Injecteur CO₂ */}
        <g className="unit">
          <rect x="168" y="118" width="110" height="104" rx="12" fill="#0d2129" stroke="rgba(196,224,220,0.4)" />
          <rect x="180" y="148" width="86" height="52" rx="8" fill={raw} opacity="0.9" />
          <text x="223" y="108" textAnchor="middle" fill="#93aeb0" fontSize="11">
            2 · Injection CO₂
          </text>
          <text x="223" y="178" textAnchor="middle" fill="#102018" fontSize="11">
            vanne dosage
          </text>
        </g>

        {/* Gaz CO₂ → injecteur */}
        <g className="gas-line">
          <rect x="188" y="24" width="48" height="58" rx="7" fill="#12343a" stroke="rgba(142,200,230,0.55)" />
          <text x="212" y="58" textAnchor="middle" fill="#e8f3f1" fontSize="11">
            CO₂
          </text>
          <path
            d="M212 82 V118"
            stroke="#dff56a"
            strokeWidth="3"
            fill="none"
            strokeDasharray={bubbling ? '5 5' : undefined}
            className={bubbling ? 'gas-pulse' : undefined}
          />
          <text x="236" y="100" fill="#dff56a" fontSize="10">
            {co2MgL.toFixed(1)} mg/L
          </text>
        </g>

        <path className="stream" d="M278 170 H330" stroke={rawStroke} strokeWidth="14" strokeLinecap="round" />
        <path className="stream-dash" d="M278 170 H330" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeDasharray="10 14" />

        {/* 3. Mélangeur statique */}
        <g className="unit">
          <rect x="330" y="110" width="150" height="120" rx="14" fill="#0c1c22" stroke="rgba(196,224,220,0.4)" />
          <rect x="344" y="142" width="122" height="68" rx="10" fill="url(#mix-fill)" />
          {bubbling
            ? [0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  className="bubble"
                  cx={360 + i * 22}
                  cy={178}
                  r={3 + (i % 2)}
                  fill="rgba(223,245,106,0.55)"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))
            : null}
          <text x="405" y="100" textAnchor="middle" fill="#93aeb0" fontSize="11">
            3 · Mélangeur statique
          </text>
          <text x="405" y="180" textAnchor="middle" fill="#102018" fontSize="11">
            dissolution CO₂
          </text>
        </g>

        <path className="stream" d="M480 170 H540" stroke={midStroke} strokeWidth="14" strokeLinecap="round" />
        <path className="stream-dash" d="M480 170 H540" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeDasharray="10 14" />

        {/* 4. Sonde pH — APRÈS le mélange */}
        <g className="unit">
          <rect x="540" y="110" width="120" height="120" rx="12" fill="#0d2129" stroke="#8ec8e6" strokeWidth="2" />
          <rect x="554" y="148" width="92" height="56" rx="8" fill={treated} opacity="0.9" />
          <circle cx="600" cy="134" r="11" fill="none" stroke="#8ec8e6" strokeWidth="2.5" />
          <text x="600" y="138" textAnchor="middle" fill="#8ec8e6" fontSize="9">
            pH
          </text>
          <text x="600" y="100" textAnchor="middle" fill="#8ec8e6" fontSize="11">
            4 · Sonde pH
          </text>
          <text x="600" y="182" textAnchor="middle" fill="#102018" fontSize="15" fontWeight="600">
            {ph.toFixed(2)}
          </text>
          <text x="600" y="248" textAnchor="middle" fill="#93aeb0" fontSize="10">
            après mélange
          </text>
        </g>

        {/* Boucle régulateur → vanne CO₂ */}
        <path
          d="M600 110 V48 H223 V82"
          fill="none"
          stroke="rgba(142,200,230,0.55)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <text x="400" y="42" textAnchor="middle" fill="#8ec8e6" fontSize="10">
          Régulateur pH → vanne CO₂
        </text>

        <path className="stream" d="M660 170 H720" stroke={treatedStroke} strokeWidth="14" strokeLinecap="round" />
        <path className="stream-dash" d="M660 170 H720" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeDasharray="10 14" />

        {/* Analyse TAC (hors chaîne d’injection) */}
        <g className="unit">
          <rect x="700" y="24" width="120" height="52" rx="10" fill="#0d2129" stroke="rgba(223,245,106,0.4)" />
          <text x="760" y="44" textAnchor="middle" fill="#93aeb0" fontSize="10">
            TAC · analyse dédiée
          </text>
          <text x="760" y="64" textAnchor="middle" fill="#dff56a" fontSize="13" fontFamily="IBM Plex Mono, monospace">
            {forage.tacDegreeF.toFixed(1)} °f
          </text>
        </g>

        {/* 5. Étape suivante */}
        <g className="unit">
          <rect x="720" y="100" width="140" height="130" rx="12" fill="#0c1c22" stroke="rgba(196,224,220,0.35)" />
          <rect x="734" y="138" width="112" height="72" rx="8" fill="url(#out-fill)" />
          <text x="790" y="88" textAnchor="middle" fill="#93aeb0" fontSize="11">
            5 · Suite procédé
          </text>
          <text x="790" y="172" textAnchor="middle" fill="#102018" fontSize="12">
            Reminéralisation
          </text>
          <text x="790" y="190" textAnchor="middle" fill="#102018" fontSize="11">
            / filtration…
          </text>
          <text x="790" y="248" textAnchor="middle" fill="#8ed6a8" fontSize="10" fontFamily="IBM Plex Mono, monospace">
            pH {ph.toFixed(2)} · TAC inchangé
          </text>
        </g>

        <g>
          <rect x="16" y="300" width="16" height="12" rx="3" fill={raw} />
          <text x="38" y="310" fill="#93aeb0" fontSize="11">
            Couleur = TAC
          </text>
          <rect x="160" y="300" width="16" height="12" rx="3" fill={treated} />
          <text x="182" y="310" fill="#93aeb0" fontSize="11">
            Après mélange : pH mesuré ici (pas trop près de l’injecteur, pas trop loin en aval)
          </text>
        </g>
      </svg>

      <div className="lab-profile co2-profile" aria-hidden>
        <span style={{ background: raw }} title="Forage" />
        <i className="lab-pipe-mini">
          <i />
        </i>
        <span style={{ background: raw }} title="Injection" />
        <i className="lab-pipe-mini">
          <i />
        </i>
        <span style={{ background: `linear-gradient(90deg, ${raw}, ${treated})` }} title="Mélangeur" />
        <i className="lab-pipe-mini">
          <i />
        </i>
        <span style={{ background: treated }} title="Sonde pH" />
        <i className="lab-pipe-mini">
          <i />
        </i>
        <span style={{ background: treated }} title="Suite" />
      </div>
    </div>
  )
}
