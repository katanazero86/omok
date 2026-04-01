import { useEffect, useMemo, useState } from 'react';
import { requestGptMove } from '../api/openai-move';
import { BoardCanvas } from '../components/BoardCanvas';
import {
  cloneBoard,
  createBoard,
  formatElapsedTime,
  getCpuMove,
  hasWinner,
  isBoardFull,
  type Board,
  type Difficulty,
  type GameResult,
  type Player,
  type RuleMode,
  type Stone,
  validateMove,
} from '../game/omok';

type MovePoint = { row: number; col: number };
type GamePhase = 'setup' | 'playing';
type StoneChoice = 'black' | 'white';
type OpponentMode = 'cpu' | 'gpt';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  low: '하',
  medium: '중',
  high: '상',
};

const RULE_LABELS: Record<RuleMode, string> = {
  free: '자유룰',
  renju: '렌주룰',
};

const STONE_CHOICE_LABELS: Record<StoneChoice, string> = {
  black: '흑돌',
  white: '백돌',
};

const OPPONENT_LABELS: Record<OpponentMode, string> = {
  cpu: 'CPU',
  gpt: 'GPT',
};

function getPlayerStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 1 : 2;
}

function getOpponentStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 2 : 1;
}

function getOpeningTurn(choice: StoneChoice): Player {
  return choice === 'black' ? 'player' : 'cpu';
}

function buildResultText(result: GameResult, opponentMode: OpponentMode) {
  if (result === 'player') {
    return '플레이어 승리';
  }
  if (result === 'cpu') {
    return `${OPPONENT_LABELS[opponentMode]} 승리`;
  }
  if (result === 'draw') {
    return '무승부';
  }
  return '진행 중';
}

export function GamePage() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [ruleMode, setRuleMode] = useState<RuleMode>('free');
  const [stoneChoice, setStoneChoice] = useState<StoneChoice>('black');
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('cpu');
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [turn, setTurn] = useState<Player>('player');
  const [result, setResult] = useState<GameResult>(null);
  const [lastMove, setLastMove] = useState<MovePoint | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const playerStone = getPlayerStone(stoneChoice);
  const opponentStone = getOpponentStone(stoneChoice);

  useEffect(() => {
    if (phase !== 'playing' || !startedAt || finishedAt) {
      return;
    }

    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [finishedAt, phase, startedAt]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || turn !== 'cpu' || result) {
      return;
    }

    let cancelled = false;
    const delay =
      opponentMode === 'gpt' ? 220 : difficulty === 'high' ? 300 : difficulty === 'medium' ? 450 : 550;

    const timer = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      try {
        const move =
          opponentMode === 'gpt'
            ? await requestGptMove(board, stoneChoice, ruleMode)
            : getCpuMove(board, difficulty, opponentStone, ruleMode);

        if (cancelled) {
          return;
        }

        const validation = validateMove(board, move.row, move.col, opponentStone, ruleMode);
        if (!validation.valid) {
          throw new Error(validation.reason ?? '상대가 둘 수 없는 칸을 선택했습니다.');
        }

        setBoard((currentBoard) => {
          if (currentBoard[move.row][move.col] !== 0) {
            throw new Error('상대가 이미 놓인 칸을 선택했습니다.');
          }

          const nextBoard = cloneBoard(currentBoard);
          nextBoard[move.row][move.col] = opponentStone;
          setLastMove(move);
          setStatusMessage(null);

          if (hasWinner(nextBoard, move.row, move.col, ruleMode)) {
            setResult('cpu');
            setFinishedAt(Date.now());
            return nextBoard;
          }

          if (isBoardFull(nextBoard)) {
            setResult('draw');
            setFinishedAt(Date.now());
            return nextBoard;
          }

          setTurn('player');
          return nextBoard;
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : '상대의 수를 가져오지 못했습니다.';
        setStatusMessage(message);
        setTurn('player');
      }
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [board, difficulty, opponentMode, opponentStone, phase, result, ruleMode, stoneChoice, turn]);

  const elapsedLabel = useMemo(() => {
    if (!startedAt) {
      return '00:00';
    }

    return formatElapsedTime((finishedAt ?? clock) - startedAt);
  }, [clock, finishedAt, startedAt]);

  const isResultModalOpen = phase === 'playing' && result !== null;
  const resultEffectClass =
    result === 'player' ? ' result-modal-win' : result === 'cpu' ? ' result-modal-lose' : ' result-modal-draw';

  const resetBoardState = (choice = stoneChoice) => {
    setBoard(createBoard());
    setTurn(getOpeningTurn(choice));
    setResult(null);
    setLastMove(null);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setClock(Date.now());
    setStatusMessage(null);
  };

  const handleBackToSetup = () => {
    resetBoardState();
    setStartedAt(null);
    setPhase('setup');
  };

  const handleStartGame = () => {
    resetBoardState(stoneChoice);
    setPhase('playing');
  };

  const handleCellSelect = (row: number, col: number) => {
    if (phase !== 'playing' || turn !== 'player' || result) {
      return;
    }

    const validation = validateMove(board, row, col, playerStone, ruleMode);
    if (!validation.valid) {
      setStatusMessage(validation.reason ?? '둘 수 없는 자리입니다.');
      return;
    }

    const nextBoard = cloneBoard(board);
    const now = Date.now();
    nextBoard[row][col] = playerStone;

    setBoard(nextBoard);
    setLastMove({ row, col });
    setStartedAt((current) => current ?? now);
    setStatusMessage(null);

    if (hasWinner(nextBoard, row, col, ruleMode)) {
      setResult('player');
      setFinishedAt(now);
      return;
    }

    if (isBoardFull(nextBoard)) {
      setResult('draw');
      setFinishedAt(now);
      return;
    }

    setTurn('cpu');
  };

  if (phase === 'setup') {
    return (
      <section className="setup-layout">
        <article className="panel-card hero-card">
          <p className="panel-label">MATCH SETUP</p>
          <h2>상대, 돌, 룰을 선택하고 시작하세요</h2>
          <p className="panel-copy">
            19x19 바둑판에서 진행됩니다. 자유룰과 렌주룰 중 하나를 고를 수 있고, 흑돌은 선공,
            백돌은 후공입니다.
          </p>
          <p className="panel-copy">
            - GPT 대전은 숨김 처리(2026.04.01)
          </p>
        </article>

        <div className="difficulty-grid">
          {/*{(['cpu', 'gpt'] as OpponentMode[]).map((mode) => (*/}
          {/*  <button*/}
          {/*    className={`difficulty-card${opponentMode === mode ? ' selected' : ''}`}*/}
          {/*    key={mode}*/}
          {/*    onClick={() => setOpponentMode(mode)}*/}
          {/*    type="button"*/}
          {/*  >*/}
          {/*    <span className="rule-index">{OPPONENT_LABELS[mode]}</span>*/}
          {/*    <strong>{OPPONENT_LABELS[mode]} 대전</strong>*/}
          {/*    <p>*/}
          {/*      {mode === 'cpu'*/}
          {/*        ? '로컬 알고리즘으로 빠르게 대전합니다.'*/}
          {/*        : '브라우저에서 OpenAI 모델을 호출해 수를 고릅니다.'}*/}
          {/*    </p>*/}
          {/*  </button>*/}
          {/*))}*/}
          {(['cpu'] as OpponentMode[]).map((mode) => (
              <button
                  className={`difficulty-card${opponentMode === mode ? ' selected' : ''}`}
                  key={mode}
                  onClick={() => setOpponentMode(mode)}
                  type="button"
              >
                <span className="rule-index">{OPPONENT_LABELS[mode]}</span>
                <strong>{OPPONENT_LABELS[mode]} 대전</strong>
                <p>
                  {mode === 'cpu'
                      ? '로컬 알고리즘으로 빠르게 대전합니다.'
                      : '브라우저에서 OpenAI 모델을 호출해 수를 고릅니다.'}
                </p>
              </button>
          ))}
        </div>

        {opponentMode === 'cpu' ? (
          <div className="difficulty-grid">
            {(['low', 'medium', 'high'] as Difficulty[]).map((level) => (
              <button
                className={`difficulty-card${difficulty === level ? ' selected' : ''}`}
                key={level}
                onClick={() => setDifficulty(level)}
                type="button"
              >
                <span className="rule-index">{DIFFICULTY_LABELS[level]}</span>
                <strong>난이도 {DIFFICULTY_LABELS[level]}</strong>
                <p>
                  {level === 'low'
                    ? '조금 더 느슨하게 수를 선택합니다.'
                    : level === 'medium'
                      ? '공격과 수비를 균형 있게 계산합니다.'
                      : '즉시 승리와 방어 우선순위를 강하게 반영합니다.'}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="difficulty-grid">
          {(['free', 'renju'] as RuleMode[]).map((mode) => (
            <button
              className={`difficulty-card${ruleMode === mode ? ' selected' : ''}`}
              key={mode}
              onClick={() => setRuleMode(mode)}
              type="button"
            >
              <span className="rule-index">{RULE_LABELS[mode]}</span>
              <strong>{RULE_LABELS[mode]}</strong>
              <p>
                {mode === 'free'
                  ? '금수 없이 5목 이상을 먼저 만들면 승리합니다.'
                  : '흑돌은 장목, 삼삼, 사사 금수가 적용됩니다.'}
              </p>
            </button>
          ))}
        </div>

        <div className="difficulty-grid">
          {(['black', 'white'] as StoneChoice[]).map((choice) => (
            <button
              className={`difficulty-card${stoneChoice === choice ? ' selected' : ''}`}
              key={choice}
              onClick={() => setStoneChoice(choice)}
              type="button"
            >
              <span className="rule-index">{STONE_CHOICE_LABELS[choice]}</span>
              <strong>{STONE_CHOICE_LABELS[choice]} 선택</strong>
              <p>{choice === 'black' ? '플레이어 선공, 상대 후공' : '상대 선공, 플레이어 후공'}</p>
            </button>
          ))}
        </div>

        <button className="pixel-button start-button" onClick={handleStartGame} type="button">
          선택한 설정으로 시작
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="game-layout">
        <div className="board-panel">
          <BoardCanvas
            board={board}
            disabled={turn !== 'player' || result !== null}
            lastMove={lastMove}
            onCellSelect={handleCellSelect}
            previewStone={playerStone}
          />
        </div>

        <aside className="info-panel">
          <div className="panel-card">
            <p className="panel-label">상태</p>
            <h2>{buildResultText(result, opponentMode)}</h2>
            <p className="panel-copy">
              {result
                ? `대국 종료. 총 소요 시간은 ${elapsedLabel}입니다.`
                : turn === 'player'
                  ? '당신의 차례입니다. 원하는 칸에 돌을 두세요.'
                  : `${OPPONENT_LABELS[opponentMode]}가 다음 수를 계산 중입니다.`}
            </p>
            {statusMessage ? <p className="error-copy">{statusMessage}</p> : null}
          </div>

          <div className="stats-grid">
            <div className="panel-card stat-card">
              <p className="panel-label">상대 모드</p>
              <strong>{OPPONENT_LABELS[opponentMode]}</strong>
            </div>
            <div className="panel-card stat-card">
              <p className="panel-label">룰</p>
              <strong>{RULE_LABELS[ruleMode]}</strong>
            </div>
            <div className="panel-card stat-card">
              <p className="panel-label">플레이어 돌</p>
              <strong>{STONE_CHOICE_LABELS[stoneChoice]}</strong>
            </div>
            <div className="panel-card stat-card">
              <p className="panel-label">상대 돌</p>
              <strong>{stoneChoice === 'black' ? '백돌' : '흑돌'}</strong>
            </div>
            <div className="panel-card stat-card">
              <p className="panel-label">선공</p>
              <strong>{stoneChoice === 'black' ? '플레이어' : OPPONENT_LABELS[opponentMode]}</strong>
            </div>
            <div className="panel-card stat-card">
              <p className="panel-label">난이도</p>
              <strong>{opponentMode === 'cpu' ? DIFFICULTY_LABELS[difficulty] : 'GPT'}</strong>
            </div>
            <div className="panel-card stat-card stat-card-wide">
              <p className="panel-label">진행 시간</p>
              <strong>{elapsedLabel}</strong>
            </div>
          </div>

          <div className="panel-card">
            <p className="panel-label">조작</p>
            <p className="panel-copy">
              빈 칸을 누르면 착수합니다. 마지막 수는 빨간 점으로 표시되고, 둘 수 있는 칸에는 반투명
              프리뷰가 보입니다.
            </p>
            <div className="action-row">
              <button className="pixel-button" onClick={handleBackToSetup} type="button">
                설정 다시 선택
              </button>
              <button className="pixel-button" onClick={handleStartGame} type="button">
                같은 설정으로 새 게임
              </button>
            </div>
          </div>
        </aside>
      </section>

      {isResultModalOpen ? (
        <div className="result-modal-backdrop" role="presentation">
          <div
            aria-labelledby="result-modal-title"
            aria-modal="true"
            className={`result-modal${resultEffectClass}`}
            role="dialog"
          >
            <div aria-hidden="true" className="result-burst" />
            <div aria-hidden="true" className="result-smoke">
              <span />
              <span />
              <span />
            </div>
            <p className="panel-label">{result === 'player' ? 'YOU WIN' : result === 'cpu' ? 'GAME OVER' : 'DRAW'}</p>
            <h2 id="result-modal-title">{buildResultText(result, opponentMode)}</h2>
            <p className="panel-copy">총 소요 시간은 {elapsedLabel}입니다.</p>
            <div className="action-row">
              <button className="pixel-button" onClick={handleStartGame} type="button">
                같은 설정으로 새 게임
              </button>
              <button className="pixel-button" onClick={handleBackToSetup} type="button">
                설정 다시 선택
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
