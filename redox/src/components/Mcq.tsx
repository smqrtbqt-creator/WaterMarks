import type { Choice } from '../types/redox'

type McqProps = {
  prompt: string
  choices: Choice[]
  picked: string | null
  answerId: string
  why: string
  onPick: (id: string) => void
}

export function Mcq({ prompt, choices, picked, answerId, why, onPick }: McqProps) {
  const locked = picked !== null
  return (
    <div>
      <p>{prompt}</p>
      <div className="choices" style={{ marginTop: '0.7rem' }}>
        {choices.map((choice) => {
          const selected = picked === choice.id
          const correct = choice.id === answerId
          let tone = 'choice'
          if (locked && correct) tone = 'choice good'
          else if (locked && selected) tone = 'choice bad'
          return (
            <button key={choice.id} type="button" className={tone} disabled={locked} onClick={() => onPick(choice.id)}>
              {choice.label}
            </button>
          )
        })}
      </div>
      {locked && (
        <p className={picked === answerId ? 'panel ok' : 'panel help'} role="status" style={{ marginTop: '0.7rem' }}>
          {picked === answerId ? 'Bonne réponse. ' : 'Pas encore. '}
          {why}
        </p>
      )}
    </div>
  )
}
