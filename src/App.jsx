import { useState } from 'react'
import Game from './Game.jsx'
import { runScoreTests } from './game/score.test.js'
import { runRulesTests } from './game/rules.test.js'
import { runStrategyTests } from './ai/strategy.test.js'
import { cardToString } from './game/state.js'
import './App.css'

/* ================================================================== */
/*  Rules page                                                         */
/* ================================================================== */

function Rules() {
  return (
    <div className="rules">
      <h2>How to Play Criss Cross Cribbage</h2>

      <section className="rules-section">
        <h3>Overview</h3>
        <p>
          Criss Cross Cribbage (CrossCribb) is a 4-player card game played on a
          5&times;5 grid. Two teams of two compete: <strong>your team</strong> (you
          and an AI partner) scores the 5 <em>columns</em>, while the{' '}
          <strong>opponent team</strong> (two AI opponents) scores the 5{' '}
          <em>rows</em>. The first team to reach the target score wins.
        </p>
      </section>

      <section className="rules-section">
        <h3>Round Flow</h3>
        <ol>
          <li>
            <strong>Deal</strong> &mdash; Each player receives 7 cards. One card
            is placed face-up in the center of the board as the <em>cut card</em>.
          </li>
          <li>
            <strong>Discard</strong> &mdash; Each player discards 1 card to the{' '}
            <em>crib</em> (4 cards total). The crib is scored at the end of the
            round and belongs to the dealer&apos;s team.
          </li>
          <li>
            <strong>Place</strong> &mdash; Players take turns placing one card
            at a time onto any empty cell of the 5&times;5 board. Each player places
            all 6 of their remaining cards.
          </li>
          <li>
            <strong>Score</strong> &mdash; Once the board is full, each column
            (5 cards) is scored for your team, each row (5 cards) is scored for the
            opponents, and the crib is scored for the dealer&apos;s team. The team
            with the higher total pegs the <em>difference</em>.
          </li>
          <li>
            <strong>Next round</strong> &mdash; The dealer rotates clockwise and a
            new round begins. Play continues until a team reaches the target score.
          </li>
        </ol>
      </section>

      <section className="rules-section">
        <h3>Scoring Reference</h3>
        <table className="rules-table">
          <thead>
            <tr><th>Combination</th><th>Points</th><th>Example</th></tr>
          </thead>
          <tbody>
            <tr><td>Fifteen</td><td>2 per combo</td><td>Cards summing to 15 (face cards = 10, Ace = 1)</td></tr>
            <tr><td>Pair</td><td>2</td><td>Two cards of the same rank</td></tr>
            <tr><td>Three of a kind</td><td>6</td><td>Three cards of the same rank (3 pairs)</td></tr>
            <tr><td>Four of a kind</td><td>12</td><td>Four cards of the same rank (6 pairs)</td></tr>
            <tr><td>Run of 3</td><td>3</td><td>Three consecutive ranks (e.g., 3-4-5)</td></tr>
            <tr><td>Run of 4</td><td>4</td><td>Four consecutive ranks (e.g., 6-7-8-9)</td></tr>
            <tr><td>Run of 5</td><td>5</td><td>Five consecutive ranks</td></tr>
            <tr><td>Flush (4 cards)</td><td>4</td><td>4 cards of same suit in a hand (not crib)</td></tr>
            <tr><td>Flush (5 cards)</td><td>5</td><td>5 cards of same suit including cut card</td></tr>
            <tr><td>His Nobs</td><td>1</td><td>Jack in hand matching suit of cut card</td></tr>
            <tr><td>His Heels</td><td>2</td><td>Cut card is a Jack (scored on deal for dealer&apos;s team)</td></tr>
          </tbody>
        </table>
        <p className="rules-note">
          Runs with duplicate ranks are scored multiple times. For example,
          3-3-4-5 contains two runs of 3 (3-4-5 twice) for 6 points, plus a
          pair for 2 points.
        </p>
      </section>

      <section className="rules-section">
        <h3>Teams &amp; Board</h3>
        <ul>
          <li><strong>Team A</strong> (You + Partner): scores the 5 <em>columns</em></li>
          <li><strong>Team B</strong> (Opponent 1 + Opponent 2): scores the 5 <em>rows</em></li>
          <li>The center cell (row 3, col 3) is always the <em>cut card</em> &mdash; it counts for both columns and rows</li>
          <li>The crib (4 discarded cards + cut card) is scored for whichever team has the dealer</li>
        </ul>
      </section>

      <section className="rules-section">
        <h3>Tips for New Players</h3>
        <ul>
          <li>Use the <strong>Hint</strong> button to see the AI&apos;s recommended move</li>
          <li>Try to build 15s and runs in your columns while disrupting opponent rows</li>
          <li>When discarding to crib: if it&apos;s your team&apos;s crib, give it good cards; if not, give it junk</li>
          <li>Pay attention to the cut card &mdash; it&apos;s part of every column and every row</li>
          <li>Start on <strong>Easy</strong> difficulty to learn, then work up to Hard</li>
        </ul>
      </section>
    </div>
  )
}

/* ================================================================== */
/*  Test dashboard                                                     */
/* ================================================================== */

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

/* ================================================================== */
/*  App shell                                                          */
/* ================================================================== */

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
          className={view === 'rules' ? 'nav-active' : ''}
          onClick={() => setView('rules')}
        >
          Rules
        </button>
        <button
          className={view === 'tests' ? 'nav-active' : ''}
          onClick={() => setView('tests')}
        >
          Tests
        </button>
      </nav>
      <div style={{ display: view === 'game' ? 'block' : 'none' }}><Game /></div>
      {view === 'rules' && <Rules />}
      {view === 'tests' && <TestDashboard />}
    </>
  )
}
