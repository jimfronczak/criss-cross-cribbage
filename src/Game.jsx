import { useState, useEffect, useCallback } from 'react';
import {
  dealRound,
  getLegalPlacements,
  discardToCrib,
  placeCard,
  scoreRound,
  startNewRound,
  checkGameOver,
  getTeam,
} from './game/index.js';
import './Game.css';

const PLAYER_NAMES = ['You', 'Opponent 1', 'Partner', 'Opponent 2'];
const SUIT_SYMBOL = { H: '♥', D: '♦', C: '♣', S: '♠' };
const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

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

/* ------------------------------------------------------------------ */
/*  Board                                                              */
/* ------------------------------------------------------------------ */

function Board({ board, canPlace, onCellClick }) {
  return (
    <div className="board-wrapper">
      <div className="board-col-label">&#8592; Your Columns (Team A) &#8594;</div>
      <div className="board-row-group">
        <div className="board-row-label">&#8593;<br/>Their<br/>Rows<br/>(Team B)<br/>&#8595;</div>
        <div className="board">
          {board.map((row, ri) =>
            row.map((cell, ci) => {
              const isCut = ri === 2 && ci === 2;
              const empty = cell === null;
              const clickable = empty && canPlace;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={
                    'cell' +
                    (empty ? ' cell-empty' : ' cell-filled') +
                    (isCut ? ' cell-cut' : '') +
                    (clickable ? ' cell-click' : '')
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
/*  Player hand                                                        */
/* ------------------------------------------------------------------ */

function PlayerHand({ hand, selected, active, onSelect }) {
  return (
    <div className="hand-area">
      <h3>Your Hand ({hand.length} card{hand.length !== 1 ? 's' : ''})</h3>
      <div className="hand">
        {hand.map((card, i) => (
          <div
            key={`${card.rank}${card.suit}`}
            className={
              'hcard' +
              (selected === i ? ' hcard-sel' : '') +
              (active ? ' hcard-act' : '')
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

function RoundResultPanel({ result, gameOver, onNextRound, onNewGame }) {
  return (
    <div className="rr">
      <h3>Round Scores</h3>
      <div className="rr-cols">
        <div className="rr-team">
          <h4 className="team-a">Your Team (Columns)</h4>
          {result.columnScores.map((s, i) => (
            <div key={i}>Col {i + 1}: {s} pts</div>
          ))}
          {result.dealerTeam === 'A' && <div>Crib: {result.cribScore} pts</div>}
          <div className="rr-total">Total: {result.teamATotal}</div>
        </div>
        <div className="rr-team">
          <h4 className="team-b">Opponents (Rows)</h4>
          {result.rowScores.map((s, i) => (
            <div key={i}>Row {i + 1}: {s} pts</div>
          ))}
          {result.dealerTeam === 'B' && <div>Crib: {result.cribScore} pts</div>}
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

  const newGame = useCallback(() => {
    setGs(dealRound(0));
    setSelected(null);
    setRoundResult(null);
    setGameOverInfo(null);
  }, []);

  /* AI auto-play: when it's not the human's turn, make a random move */
  useEffect(() => {
    if (!gs || gs.phase === 'score' || gs.currentPlayerIndex === 0) return;

    const timer = setTimeout(() => {
      const pi = gs.currentPlayerIndex;

      if (gs.phase === 'discard') {
        const idx = Math.floor(Math.random() * gs.hands[pi].length);
        setGs(discardToCrib(gs, idx));
      } else if (gs.phase === 'place') {
        const cardIdx = Math.floor(Math.random() * gs.hands[pi].length);
        const legal = getLegalPlacements(gs);
        const cell = legal[Math.floor(Math.random() * legal.length)];
        setGs(placeCard(gs, cardIdx, cell.row, cell.col));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [gs]);

  /* Compute scores when board fills up */
  useEffect(() => {
    if (gs?.phase === 'score' && !roundResult) {
      const r = scoreRound(gs);
      setRoundResult(r);
      const go = checkGameOver(r.newScores);
      if (go.over) setGameOverInfo(go);
    }
  }, [gs?.phase, roundResult]);

  /* ---- human actions ---- */

  const handleHandClick = (idx) => {
    if (!gs || gs.currentPlayerIndex !== 0) return;
    setSelected(selected === idx ? null : idx);
  };

  const handleDiscard = () => {
    if (selected === null || gs.phase !== 'discard') return;
    setGs(discardToCrib(gs, selected));
    setSelected(null);
  };

  const handleCellClick = (row, col) => {
    if (!gs || gs.currentPlayerIndex !== 0) return;
    if (gs.phase !== 'place' || selected === null) return;
    if (gs.board[row][col] !== null) return;
    setGs(placeCard(gs, selected, row, col));
    setSelected(null);
  };

  const handleNextRound = () => {
    if (!roundResult) return;
    setGs(startNewRound(gs.dealerIndex, roundResult.newScores));
    setRoundResult(null);
    setSelected(null);
    setGameOverInfo(null);
  };

  /* ---- render ---- */

  if (!gs) {
    return (
      <div className="game">
        <h1>Criss Cross Cribbage</h1>
        <p className="intro">
          4 players · 2 teams · Your team scores <strong>columns</strong>,
          opponents score <strong>rows</strong>. First to 31 wins.
        </p>
        <button className="btn-pri" onClick={newGame}>New Game</button>
      </div>
    );
  }

  const human = gs.currentPlayerIndex === 0;
  const canPlace = human && gs.phase === 'place' && selected !== null;

  return (
    <div className="game">
      {/* Header */}
      <div className="hdr">
        <h2>Criss Cross Cribbage</h2>
        <div className="scores">
          <span className="team-a">Your Team: {gs.scores[0]}</span>
          <span className="score-sep">|</span>
          <span className="team-b">Opponents: {gs.scores[1]}</span>
        </div>
        <div className="meta">
          <span>Dealer: {PLAYER_NAMES[gs.dealerIndex]}</span>
          <span>Phase: {gs.phase}</span>
          <span>Crib: {gs.crib.length}/4</span>
        </div>
        {gs.hisHeels && (
          <div className="heels">His Heels! Cut is a Jack — dealer's team pegs 2</div>
        )}
        <StatusBar gameState={gs} isHumanTurn={human} selectedCard={selected} />
      </div>

      {/* Cut card callout */}
      <div className="cut-info">
        Cut card: <CardFace card={gs.cutCard} className="cut-badge" />
      </div>

      {/* Board */}
      <Board board={gs.board} canPlace={canPlace} onCellClick={handleCellClick} />

      {/* Hand + discard button */}
      {gs.phase !== 'score' && (
        <>
          <PlayerHand
            hand={gs.hands[0]}
            selected={selected}
            active={human}
            onSelect={handleHandClick}
          />
          {human && gs.phase === 'discard' && selected !== null && (
            <div className="discard-bar">
              <button className="btn-disc" onClick={handleDiscard}>
                Discard to Crib
              </button>
            </div>
          )}
        </>
      )}

      {/* Round result */}
      {roundResult && (
        <RoundResultPanel
          result={roundResult}
          gameOver={gameOverInfo}
          onNextRound={handleNextRound}
          onNewGame={newGame}
        />
      )}

      {/* Footer */}
      <div className="foot">
        <button className="btn-sec" onClick={newGame}>Restart</button>
      </div>
    </div>
  );
}
