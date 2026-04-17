import { useState, useEffect, useCallback } from 'react';
import {
  dealRound,
  discardToCrib,
  placeCard,
  scoreRound,
  startNewRound,
  checkGameOver,
  getTeam,
  DEFAULT_WIN_TARGET,
  DEFAULT_VARIANT,
} from './game/index.js';
import { getAIPlacement, getAIDiscard, getHint, DIFFICULTIES } from './ai/strategy.js';
import './Game.css';

const PLAYER_NAMES = ['You', 'Opponent 1', 'Partner', 'Opponent 2'];
const SUIT_SYMBOL = { H: '♥', D: '♦', C: '♣', S: '♠' };
const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const WIN_TARGET_OPTIONS = [15, 21, 31, 61];

const VARIANT_OPTIONS = [
  { id: 'classic', title: 'Classic', subtitle: '7 cards, with crib' },
  { id: 'noCrib',  title: 'No-Crib', subtitle: '6 cards, no crib' },
];

const CARD_BACKS = [
  { bg: 'repeating-linear-gradient(45deg,#1a237e,#1a237e 3px,#283593 3px,#283593 6px)', border: '#3949ab' },
  { bg: 'repeating-linear-gradient(-45deg,#6a1b1b,#6a1b1b 3px,#7c2d2d 3px,#7c2d2d 6px)', border: '#b71c1c' },
  { bg: 'repeating-linear-gradient(60deg,#1b5e20,#1b5e20 3px,#2e7d32 3px,#2e7d32 6px)', border: '#43a047' },
  { bg: 'repeating-linear-gradient(135deg,#4a148c,#4a148c 3px,#6a1b9a 3px,#6a1b9a 6px)', border: '#8e24aa' },
  { bg: 'repeating-linear-gradient(30deg,#bf360c,#bf360c 3px,#d84315 3px,#d84315 6px)', border: '#ff5722' },
  { bg: 'repeating-linear-gradient(-60deg,#004d40,#004d40 3px,#00695c 3px,#00695c 6px)', border: '#26a69a' },
  { bg: 'repeating-linear-gradient(75deg,#263238,#263238 3px,#37474f 3px,#37474f 6px)', border: '#546e7a' },
  { bg: 'repeating-linear-gradient(-30deg,#3e2723,#3e2723 3px,#4e342e 3px,#4e342e 6px)', border: '#795548' },
];

function cardLabel(card) {
  const rank = RANK_LABEL[card.rank] || String(card.rank);
  return rank + SUIT_SYMBOL[card.suit];
}

function isRed(card) {
  return card.suit === 'H' || card.suit === 'D';
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function CardFace({ card, className = '', onClick }) {
  if (!card) return null;
  return (
    <span
      className={`cf ${isRed(card) ? 'cf-red' : 'cf-blk'} ${className}`}
      onClick={onClick}
    >
      {cardLabel(card)}
    </span>
  );
}

function CardBack({ className = '', backStyle }) {
  const style = backStyle
    ? { background: backStyle.bg, borderColor: backStyle.border }
    : {};
  return <div className={`card-back ${className}`} style={style} />;
}

function StatusBar({ gameState, isHumanTurn, selectedCard }) {
  const who = PLAYER_NAMES[gameState.currentPlayerIndex];
  let msg = '';
  if (gameState.phase === 'discard') {
    msg = isHumanTurn
      ? 'Select a card, then click "Discard to Crib"'
      : `${who} is discarding…`;
  } else if (gameState.phase === 'place') {
    msg = isHumanTurn
      ? selectedCard !== null
        ? 'Now click an empty cell to place it'
        : 'Select a card from your hand'
      : `${who} is placing a card…`;
  } else if (gameState.phase === 'score') {
    msg = 'Round complete!';
  }
  return <div className="status">{msg}</div>;
}

function ScoreTrack({ scores, winTarget }) {
  const pctA = Math.min(100, (scores[0] / winTarget) * 100);
  const pctB = Math.min(100, (scores[1] / winTarget) * 100);
  return (
    <div className="score-track">
      <div className="st-row">
        <span className="st-label team-a">You</span>
        <div className="st-bar">
          <div className="st-fill st-fill-a" style={{ width: `${pctA}%` }} />
        </div>
        <span className="st-val">{scores[0]}/{winTarget}</span>
      </div>
      <div className="st-row">
        <span className="st-label team-b">Opp</span>
        <div className="st-bar">
          <div className="st-fill st-fill-b" style={{ width: `${pctB}%` }} />
        </div>
        <span className="st-val">{scores[1]}/{winTarget}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Board                                                              */
/* ------------------------------------------------------------------ */

function Board({ board, canPlace, onCellClick, hintCell }) {
  return (
    <div className="board-area">
      <div className="board-col-label">&#8592; Your Columns &#8594;</div>
      <div className="board-inner">
        <div className="board-row-label">&#8593;<br/>Their<br/>Rows<br/>&#8595;</div>
        <div className="board">
          {board.map((row, ri) =>
            row.map((cell, ci) => {
              const isCut = ri === 2 && ci === 2;
              const empty = cell === null;
              const clickable = empty && canPlace;
              const isHint = hintCell && hintCell.row === ri && hintCell.col === ci;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={
                    'cell' +
                    (empty ? ' cell-empty' : ' cell-filled') +
                    (isCut ? ' cell-cut' : '') +
                    (clickable ? ' cell-click' : '') +
                    (isHint ? ' cell-hint' : '')
                  }
                  onClick={() => clickable && onCellClick(ri, ci)}
                >
                  {cell && <CardFace card={cell} />}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Other players' hands                                               */
/* ------------------------------------------------------------------ */

function OtherHand({ hand, faceUp, label, active, vertical, backStyle, isDealer }) {
  if (hand.length === 0) {
    return (
      <div className={`other-hand ${vertical ? 'other-v' : 'other-h'} ${active ? 'oh-active' : ''}`}>
        <div className="oh-label">
          {label}
          {isDealer && <span className="dealer-badge">D</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`other-hand ${vertical ? 'other-v' : 'other-h'} ${active ? 'oh-active' : ''}`}>
      <div className="oh-label">
        {label}
        {isDealer && <span className="dealer-badge">D</span>}
        <span className="oh-count">{hand.length}</span>
      </div>
      <div className={`oh-cards ${vertical ? 'oh-cards-v' : 'oh-cards-h'}`}>
        {hand.map((card, i) =>
          faceUp ? (
            <div key={i} className={`oh-card ${vertical ? 'oh-card-v' : ''}`}>
              <span className={`oh-rank ${isRed(card) ? 'cf-red' : 'cf-blk'}`}>
                {RANK_LABEL[card.rank] || card.rank}
              </span>
              <span className={`oh-suit ${isRed(card) ? 'cf-red' : 'cf-blk'}`}>
                {SUIT_SYMBOL[card.suit]}
              </span>
            </div>
          ) : (
            <CardBack key={i} className={vertical ? 'cb-v' : 'cb-h'} backStyle={backStyle} />
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Human player's hand                                                */
/* ------------------------------------------------------------------ */

function PlayerHand({ hand, selected, active, onSelect, isDealer, hintIndex }) {
  return (
    <div className="hand-area">
      <h3>
        Your Hand ({hand.length} card{hand.length !== 1 ? 's' : ''})
        {isDealer && <span className="dealer-badge">D</span>}
      </h3>
      <div className="hand">
        {hand.map((card, i) => (
          <div
            key={`${card.rank}${card.suit}`}
            className={
              'hcard' +
              (selected === i ? ' hcard-sel' : '') +
              (active ? ' hcard-act' : '') +
              (hintIndex === i ? ' hcard-hint' : '')
            }
            onClick={() => active && onSelect(i)}
          >
            <span className={`hcard-rank ${isRed(card) ? 'cf-red' : 'cf-blk'}`}>
              {RANK_LABEL[card.rank] || card.rank}
            </span>
            <span className={`hcard-suit ${isRed(card) ? 'cf-red' : 'cf-blk'}`}>
              {SUIT_SYMBOL[card.suit]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Round result                                                       */
/* ------------------------------------------------------------------ */

function RoundResultPanel({ result, crib, cutCard, variant, gameOver, onNextRound, onNewGame }) {
  const showCrib = variant !== 'noCrib';
  return (
    <div className="rr">
      <h3>Round Scores</h3>

      {showCrib && (
        <div className="rr-crib">
          <span className="rr-crib-label">
            Crib ({result.dealerTeam === 'A' ? 'Your team' : 'Opponents'}):
          </span>
          <span className="rr-crib-cards">
            {crib.map((c, i) => (
              <CardFace key={i} card={c} className="rr-card" />
            ))}
            <span className="rr-crib-plus">+</span>
            <CardFace card={cutCard} className="rr-card rr-card-cut" />
          </span>
          <span className="rr-crib-score">= {result.cribScore} pts</span>
        </div>
      )}

      <div className="rr-cols">
        <div className="rr-team">
          <h4 className="team-a">Your Team (Columns)</h4>
          {result.columnScores.map((s, i) => (
            <div key={i}>Col {i + 1}: {s} pts</div>
          ))}
          {showCrib && result.dealerTeam === 'A' && <div>Crib: {result.cribScore} pts</div>}
          <div className="rr-total">Total: {result.teamATotal}</div>
        </div>
        <div className="rr-team">
          <h4 className="team-b">Opponents (Rows)</h4>
          {result.rowScores.map((s, i) => (
            <div key={i}>Row {i + 1}: {s} pts</div>
          ))}
          {showCrib && result.dealerTeam === 'B' && <div>Crib: {result.cribScore} pts</div>}
          <div className="rr-total">Total: {result.teamBTotal}</div>
        </div>
      </div>
      <div className="rr-peg">
        {result.pegTeam
          ? `${result.pegTeam === 'A' ? 'Your team' : 'Opponents'} peg ${result.pegAmount} points!`
          : 'Tie — no pegging this round.'}
      </div>
      <div className="rr-scores">
        Scores: Your Team {result.newScores[0]} – Opponents {result.newScores[1]}
      </div>
      {gameOver ? (
        <div className="go">
          <h2>{gameOver.winner === 'A' ? 'You Win!' : 'Opponents Win!'}</h2>
          <button className="btn-pri" onClick={onNewGame}>New Game</button>
        </div>
      ) : (
        <button className="btn-pri" onClick={onNextRound}>Next Round</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Game component                                                */
/* ------------------------------------------------------------------ */

export default function Game() {
  const [gs, setGs] = useState(null);
  const [selected, setSelected] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [gameOverInfo, setGameOverInfo] = useState(null);
  const [showPartner, setShowPartner] = useState(false);
  const [cardBack, setCardBack] = useState(CARD_BACKS[0]);
  const [roundNum, setRoundNum] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [winTarget, setWinTarget] = useState(DEFAULT_WIN_TARGET);
  const [variant, setVariant] = useState(DEFAULT_VARIANT);
  const [hint, setHint] = useState(null);

  const newGame = useCallback(() => {
    setGs(dealRound(0, [0, 0], variant));
    setSelected(null);
    setRoundResult(null);
    setGameOverInfo(null);
    setCardBack(CARD_BACKS[Math.floor(Math.random() * CARD_BACKS.length)]);
    setRoundNum(1);
    setHint(null);
  }, [variant]);

  const backToSetup = useCallback(() => {
    setGs(null);
    setSelected(null);
    setRoundResult(null);
    setGameOverInfo(null);
    setRoundNum(0);
    setHint(null);
  }, []);

  /* AI auto-play */
  useEffect(() => {
    if (!gs || gs.phase === 'score' || gs.currentPlayerIndex === 0) return;

    const timer = setTimeout(() => {
      if (gs.phase === 'discard') {
        const { cardIndex } = getAIDiscard(gs, difficulty);
        setGs(discardToCrib(gs, cardIndex));
      } else if (gs.phase === 'place') {
        const { cardIndex, row, col } = getAIPlacement(gs, difficulty);
        setGs(placeCard(gs, cardIndex, row, col));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [gs, difficulty]);

  /* Compute scores when board fills up */
  useEffect(() => {
    if (gs?.phase === 'score' && !roundResult) {
      const r = scoreRound(gs);
      setRoundResult(r);
      const go = checkGameOver(r.newScores, winTarget);
      if (go.over) setGameOverInfo(go);
    }
  }, [gs?.phase, roundResult, winTarget]);

  /* Clear hint when turn or phase changes */
  useEffect(() => {
    setHint(null);
  }, [gs?.currentPlayerIndex, gs?.phase]);

  /* ---- human actions ---- */

  const handleHandClick = (idx) => {
    if (!gs || gs.currentPlayerIndex !== 0) return;
    setSelected(selected === idx ? null : idx);
  };

  const handleDiscard = () => {
    if (selected === null || gs.phase !== 'discard') return;
    setGs(discardToCrib(gs, selected));
    setSelected(null);
    setHint(null);
  };

  const handleCellClick = (row, col) => {
    if (!gs || gs.currentPlayerIndex !== 0) return;
    if (gs.phase !== 'place' || selected === null) return;
    if (gs.board[row][col] !== null) return;
    setGs(placeCard(gs, selected, row, col));
    setSelected(null);
    setHint(null);
  };

  const handleNextRound = () => {
    if (!roundResult) return;
    setGs(startNewRound(gs.dealerIndex, roundResult.newScores, gs.variant));
    setRoundResult(null);
    setSelected(null);
    setGameOverInfo(null);
    setRoundNum((n) => n + 1);
    setHint(null);
  };

  const handleHint = () => {
    if (!gs || gs.currentPlayerIndex !== 0) return;
    const h = getHint(gs);
    setHint(h);
    if (h) setSelected(h.cardIndex);
  };

  /* ---- render ---- */

  if (!gs) {
    return (
      <div className="game">
        <h1>Criss Cross Cribbage</h1>
        <p className="intro">
          4 players · 2 teams · Your team scores <strong>columns</strong>,
          opponents score <strong>rows</strong>.
        </p>

        <div className="setup">
          <div className="setup-group">
            <label className="setup-label">Game Mode</label>
            <div className="setup-options">
              {VARIANT_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  className={`setup-btn setup-btn-variant ${variant === v.id ? 'setup-btn-active' : ''}`}
                  onClick={() => setVariant(v.id)}
                >
                  <span className="setup-btn-title">{v.title}</span>
                  <span className="setup-btn-sub">{v.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-group">
            <label className="setup-label">Difficulty</label>
            <div className="setup-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`setup-btn ${difficulty === d ? 'setup-btn-active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-group">
            <label className="setup-label">Points to win</label>
            <div className="setup-options">
              {WIN_TARGET_OPTIONS.map((t) => (
                <button
                  key={t}
                  className={`setup-btn ${winTarget === t ? 'setup-btn-active' : ''}`}
                  onClick={() => setWinTarget(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn-pri" onClick={newGame}>New Game</button>
      </div>
    );
  }

  const human = gs.currentPlayerIndex === 0;
  const canPlace = human && gs.phase === 'place' && selected !== null;
  const inPlay = gs.phase !== 'score';
  const dealerTeam = getTeam(gs.dealerIndex);
  const hintCell = hint && hint.row !== undefined ? { row: hint.row, col: hint.col } : null;

  return (
    <div className="game">
      {/* Header */}
      <div className="hdr">
        <h2>Criss Cross Cribbage</h2>
        <ScoreTrack scores={gs.scores} winTarget={winTarget} />
        <div className="meta">
          <span>Round {roundNum}</span>
          <span>Dealer: {PLAYER_NAMES[gs.dealerIndex]}</span>
          {gs.variant !== 'noCrib' && (
            <span>
              Crib ({dealerTeam === 'A' ? 'yours' : 'theirs'}): {gs.crib.length}/4
            </span>
          )}
          {gs.variant === 'noCrib' && <span>No-Crib</span>}
          <span>AI: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
        </div>
        {gs.hisHeels && (
          <div className="heels">His Heels! Cut is a Jack — dealer&apos;s team pegs 2</div>
        )}
        <StatusBar gameState={gs} isHumanTurn={human} selectedCard={selected} />
      </div>

      {/* Cut card callout */}
      <div className="cut-info">
        Cut card: <CardFace card={gs.cutCard} className="cut-badge" />
      </div>

      {/* ===== Game table: 4 hands around the board ===== */}
      <div className="table">
        {/* Partner (top) */}
        <div className="table-top">
          <OtherHand
            hand={gs.hands[2]}
            faceUp={showPartner}
            label="Partner"
            active={gs.currentPlayerIndex === 2 && inPlay}
            vertical={false}
            backStyle={cardBack}
            isDealer={gs.dealerIndex === 2}
          />
          {gs.hands[2].length > 0 && (
            <button
              className="btn-toggle"
              onClick={() => setShowPartner((v) => !v)}
            >
              {showPartner ? 'Hide cards' : 'Show cards'}
            </button>
          )}
        </div>

        {/* Opponent 1 (left) */}
        <div className="table-left">
          <OtherHand
            hand={gs.hands[1]}
            faceUp={false}
            label="Opp 1"
            active={gs.currentPlayerIndex === 1 && inPlay}
            vertical={true}
            backStyle={cardBack}
            isDealer={gs.dealerIndex === 1}
          />
        </div>

        {/* Board (center) */}
        <div className="table-center">
          <Board board={gs.board} canPlace={canPlace} onCellClick={handleCellClick} hintCell={hintCell} />
        </div>

        {/* Opponent 2 (right) */}
        <div className="table-right">
          <OtherHand
            hand={gs.hands[3]}
            faceUp={false}
            label="Opp 2"
            active={gs.currentPlayerIndex === 3 && inPlay}
            vertical={true}
            backStyle={cardBack}
            isDealer={gs.dealerIndex === 3}
          />
        </div>

        {/* Human (bottom) */}
        <div className="table-bottom">
          {inPlay && (
            <>
              <PlayerHand
                hand={gs.hands[0]}
                selected={selected}
                active={human}
                onSelect={handleHandClick}
                isDealer={gs.dealerIndex === 0}
                hintIndex={hint ? hint.cardIndex : null}
              />
              <div className="action-bar">
                {human && gs.phase === 'discard' && selected !== null && (
                  <button className="btn-disc" onClick={handleDiscard}>
                    Discard to Crib
                  </button>
                )}
                {human && (
                  <button className="btn-hint" onClick={handleHint}>
                    💡 Hint
                  </button>
                )}
              </div>
              {hint && (
                <div className="hint-msg">
                  {gs.phase === 'discard'
                    ? `Hint: discard the ${cardLabel(gs.hands[0][hint.cardIndex])}`
                    : hint.row !== undefined
                      ? `Hint: place ${cardLabel(gs.hands[0][hint.cardIndex])} at row ${hint.row + 1}, col ${hint.col + 1}`
                      : `Hint: select the ${cardLabel(gs.hands[0][hint.cardIndex])}`}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Round result */}
      {roundResult && (
        <RoundResultPanel
          result={roundResult}
          crib={gs.crib}
          cutCard={gs.cutCard}
          variant={gs.variant}
          gameOver={gameOverInfo}
          onNextRound={handleNextRound}
          onNewGame={backToSetup}
        />
      )}

      {/* Footer */}
      <div className="foot">
        <button className="btn-sec" onClick={backToSetup}>Restart</button>
      </div>
    </div>
  );
}
