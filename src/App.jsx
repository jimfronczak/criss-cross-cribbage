import { useState } from 'react'
import Game from './Game.jsx'
import { runScoreTests } from './game/score.test.js'
import { runRulesTests } from './game/rules.test.js'
import { runStrategyTests } from './ai/strategy.test.js'
import { cardToString } from './game/state.js'
import './App.css'

function TestSection({ title, results, color }) {
  if (!results) return null
  const allOk = results.every(r => r.ok)
  return (
    <div className="test-results">
      <h3 style={{ color }}>{title}</h3>
      <p className={allOk ? 'test-ok' : 'test-fail'}>
        {allOk ? 'All tests passed.' : 'Some tests failed.'}
      </p>
      <ul>
        {results.map((r, i) => (
          <li key={i} className={r.ok ? 'test-ok' : 'test-fail'}>
            {r.name}: expected {r.expected}, got {r.got} {r.ok ? '✓' : '✗'}
            {r.cards && (
              <span className={r.random ? 'test-cards-random' : 'test-cards-fixed'}>
                {' '}[{r.cards.map(c => cardToString(c)).join(' ')}]
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TestDashboard() {
  const [scoreResults, setScoreResults] = useState(null)
  const [rulesResults, setRulesResults] = useState(null)
  const [stratResults, setStratResults] = useState(null)

  const runAll = () => {
    setScoreResults(runScoreTests())
    setRulesResults(runRulesTests())
    setStratResults(runStrategyTests())
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
      <h2>Engine Test Dashboard</h2>
      <button className="btn-pri" onClick={runAll} style={{ marginBottom: 16 }}>
        Run all tests
      </button>
      <TestSection title="Phase 2 — Scoring" results={scoreResults} color="#4fc3f7" />
      <TestSection title="Phase 3 — Rules & State" results={rulesResults} color="#81c784" />
      <TestSection title="Phase 5 — AI Strategy" results={stratResults} color="#ffb74d" />
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('game')

  return (
    <>
      <nav className="top-nav">
        <button
          className={view === 'game' ? 'nav-active' : ''}
          onClick={() => setView('game')}
        >
          Game
        </button>
        <button
          className={view === 'tests' ? 'nav-active' : ''}
          onClick={() => setView('tests')}
        >
          Tests
        </button>
      </nav>
      {view === 'game' ? <Game /> : <TestDashboard />}
    </>
  )
}
