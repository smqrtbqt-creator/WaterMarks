import { useState } from 'react'
import { Mcq } from '../components/Mcq'
import { QUIZ } from '../data/quiz'

type Answer = { picked: string; correct: boolean }

export function QuizPage() {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const finished = index >= QUIZ.length
  const question = QUIZ[index]
  const current = question ? answers[question.id] : undefined
  const score = QUIZ.filter((item) => answers[item.id]?.correct).length
  const missed = QUIZ.filter((item) => answers[item.id] && !answers[item.id].correct)

  if (finished) {
    return (
      <section className="panel">
        <p className="mark">Quart de révision</p>
        <h2>
          Score : {score} / {QUIZ.length}
        </h2>
        {missed.length === 0 ? (
          <p style={{ marginTop: '0.7rem' }}>Tout est juste. Le réducteur donne et s’oxyde. L’oxydant capte et se réduit.</p>
        ) : (
          <ul style={{ margin: '0.8rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
            {missed.map((item) => (
              <li key={item.id} className="panel">
                <p>{item.prompt}</p>
                <p style={{ marginTop: '0.35rem', color: 'var(--ok)' }}>
                  Bonne réponse : {item.choices.find((choice) => choice.id === item.answerId)?.label}. {item.why}
                </p>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="primary"
          style={{ marginTop: '0.9rem' }}
          onClick={() => {
            setAnswers({})
            setIndex(0)
          }}
        >
          Recommencer
        </button>
      </section>
    )
  }

  return (
    <section className="panel">
      <p className="mark">
        {question.title} — {index + 1} / {QUIZ.length}
      </p>
      <h2>Quiz</h2>
      {question.formula && (
        <p className="formula" style={{ marginTop: '0.7rem' }}>
          {question.formula}
        </p>
      )}
      <div style={{ marginTop: '0.8rem' }}>
        <Mcq
          prompt={question.prompt}
          choices={question.choices}
          picked={current?.picked ?? null}
          answerId={question.answerId}
          why={question.why}
          onPick={(id) =>
            setAnswers((previous) => ({
              ...previous,
              [question.id]: { picked: id, correct: id === question.answerId },
            }))
          }
        />
      </div>
      <button
        type="button"
        className="primary"
        style={{ marginTop: '0.9rem' }}
        disabled={!current}
        onClick={() => setIndex((currentIndex) => currentIndex + 1)}
      >
        {index === QUIZ.length - 1 ? 'Voir le score' : 'Question suivante'}
      </button>
    </section>
  )
}
