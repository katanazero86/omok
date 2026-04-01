import { useEffect, useMemo, useState } from 'react';
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
  type Stone,
} from '../game/omok';

type MovePoint = { row: number; col: number };
type GamePhase = 'setup' | 'playing';
type StoneChoice = 'black' | 'white';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  low: '하',
  medium: '중',
  high: '상',
};

const STONE_CHOICE_LABELS: Record<StoneChoice, string> = {
  black: '흑돌',
  white: '백돌',
};

function buildResultText(result: GameResult) {
  if (result === 'player') {
    return '플레이어 승리';
  }
  if (result === 'cpu') {
    return 'CPU 승리';
  }
  if (result === 'draw') {
    return '무승부';
  }
  return '진행 중';
}

function getPlayerStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 1 : 2;
}

function getCpuStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 2 : 1;
}

function getOpeningTurn(choice: StoneChoice): Player {
  return choice === 'black' ? 'player' : 'cpu';
}

export function GamePage() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stoneChoice, setStoneChoice] = useState<StoneChoice>('black');
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [turn, setTurn] = useState<Player>('player');
  const [result, setResult] = useState<GameResult>(null);
  const [lastMove, setLastMove] = useState<MovePoint | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());

  const playerStone = getPlayerStone(stoneChoice);
  const cpuStone = getCpuStone(stoneChoice);

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

    const timer = window.setTimeout(() => {
      setBoard((currentBoard) => {
        const move = getCpuMove(currentBoard, difficulty, cpuStone);
        const nextBoard = cloneBoard(currentBoard);
        nextBoard[move.row][move.col] = cpuStone;
        setLastMove(move);

        if (hasWinner(nextBoard, move.row, move.col)) {
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
    }, difficulty === 'high' ? 300 : difficulty === 'medium' ? 450 : 550);

    return () => window.clearTimeout(timer);
  }, [cpuStone, difficulty, phase, result, turn]);

  const elapsedLabel = useMemo(() => {
    if (!startedAt) {
      return '00:00';
    }

    return formatElapsedTime((finishedAt ?? clock) - startedAt);
  }, [clock, finishedAt, startedAt]);

  const isResultModalOpen = phase === 'playing' && result !== null;

  const resetBoardState = (choice = stoneChoice) => {
    setBoard(createBoard());
    setTurn(getOpeningTurn(choice));
    setResult(null);
    setLastMove(null);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setClock(Date.now());
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
    if (phase !== 'playing' || turn !== 'player' || result || board[row][col] !== 0) {
      return;
    }

    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = playerStone;
    const now = Date.now();
    setBoard(nextBoard);
    setLastMove({ row, col });
    setStartedAt((current) => current ?? now);

    if (hasWinner(nextBoard, row, col)) {
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
          <h2>난이도와 돌 색을 선택하고 시작하세요</h2>
          <p className="panel-copy">
            이번 대국은 19x19 바둑판에서 진행됩니다. 흑돌을 고르면 선공, 백돌을 고르면 후공으로
            시작합니다.
          </p>
        </article>

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
                  ? '상위 후보 중에서 비교적 느슨하게 수를 고릅니다.'
                  : level === 'medium'
                    ? '공격과 수비를 균형 있게 판단합니다.'
                    : '즉시 위협과 연결 가치를 더 강하게 반영합니다.'}
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
              <p>{choice === 'black' ? '플레이어 선공, CPU 후공' : 'CPU 선공, 플레이어 후공'}</p>
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
            <h2>{buildResultText(result)}</h2>
            <p className="panel-copy">
              {result
                ? `대국 종료. 총 소요 시간은 ${elapsedLabel}입니다.`
                : turn === 'player'
                  ? '당신의 차례입니다. 선택한 돌을 두세요.'
                  : 'CPU가 수를 계산 중입니다.'}
            </p>
          </div>

          <div className="stats-grid">
            <div className="panel-card">
              <p className="panel-label">플레이어 돌</p>
              <strong>{STONE_CHOICE_LABELS[stoneChoice]}</strong>
            </div>
            <div className="panel-card">
              <p className="panel-label">CPU 돌</p>
              <strong>{stoneChoice === 'black' ? '백돌' : '흑돌'}</strong>
            </div>
            <div className="panel-card">
              <p className="panel-label">선공</p>
              <strong>{stoneChoice === 'black' ? '플레이어' : 'CPU'}</strong>
            </div>
            <div className="panel-card">
              <p className="panel-label">난이도</p>
              <strong>{DIFFICULTY_LABELS[difficulty]}</strong>
            </div>
            <div className="panel-card">
              <p className="panel-label">진행 시간</p>
              <strong>{elapsedLabel}</strong>
            </div>
            <div className="panel-card">
              <p className="panel-label">현재 턴</p>
              <strong>{result ? '종료' : turn === 'player' ? '플레이어' : 'CPU'}</strong>
            </div>
          </div>

          <div className="panel-card">
            <p className="panel-label">조작</p>
            <p className="panel-copy">
              바둑판 칸을 클릭해 착수합니다. 마지막 수는 빨간 점으로 표시되고, 빈 칸 위에는 반투명
              프리뷰가 나타납니다.
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
            className="result-modal"
            role="dialog"
          >
            <p className="panel-label">GAME OVER</p>
            <h2 id="result-modal-title">{buildResultText(result)}</h2>
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
