export const BOARD_SIZE = 19;
export const CELL_SIZE = 28;
export const GRID_OFFSET = 32;

export type Stone = 0 | 1 | 2;
export type Player = 'player' | 'cpu';
export type GameResult = 'player' | 'cpu' | 'draw' | null;
export type Difficulty = 'low' | 'medium' | 'high';
export type Board = Stone[][];
type Point = { row: number; col: number };

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isBoardFull(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== 0));
}

export function hasWinner(board: Board, row: number, col: number): boolean {
  const stone = board[row][col];
  if (!stone) {
    return false;
  }

  return DIRECTIONS.some(([dRow, dCol]) => {
    let count = 1;
    count += countDirection(board, row, col, dRow, dCol, stone);
    count += countDirection(board, row, col, -dRow, -dCol, stone);
    return count >= 5;
  });
}

function countDirection(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  stone: Stone,
) {
  let count = 0;
  let nextRow = row + dRow;
  let nextCol = col + dCol;

  while (
    nextRow >= 0 &&
    nextRow < BOARD_SIZE &&
    nextCol >= 0 &&
    nextCol < BOARD_SIZE &&
    board[nextRow][nextCol] === stone
  ) {
    count += 1;
    nextRow += dRow;
    nextCol += dCol;
  }

  return count;
}

function getCandidateMoves(board: Board): Point[] {
  const candidates = new Map<string, Point>();
  let hasStone = false;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === 0) {
        continue;
      }

      hasStone = true;
      for (let dRow = -2; dRow <= 2; dRow += 1) {
        for (let dCol = -2; dCol <= 2; dCol += 1) {
          const nextRow = row + dRow;
          const nextCol = col + dCol;
          if (
            nextRow < 0 ||
            nextRow >= BOARD_SIZE ||
            nextCol < 0 ||
            nextCol >= BOARD_SIZE ||
            board[nextRow][nextCol] !== 0
          ) {
            continue;
          }

          candidates.set(`${nextRow}:${nextCol}`, { row: nextRow, col: nextCol });
        }
      }
    }
  }

  if (!hasStone) {
    return [{ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) }];
  }

  return [...candidates.values()];
}

function getLineScore(length: number, openEnds: number) {
  if (length >= 5) {
    return 1_000_000;
  }
  if (length === 4 && openEnds === 2) {
    return 120_000;
  }
  if (length === 4 && openEnds === 1) {
    return 24_000;
  }
  if (length === 3 && openEnds === 2) {
    return 12_000;
  }
  if (length === 3 && openEnds === 1) {
    return 3_200;
  }
  if (length === 2 && openEnds === 2) {
    return 1_200;
  }
  if (length === 2 && openEnds === 1) {
    return 220;
  }
  if (length === 1 && openEnds === 2) {
    return 60;
  }
  return 12;
}

function evaluatePoint(board: Board, row: number, col: number, stone: Exclude<Stone, 0>) {
  let score = 0;

  for (const [dRow, dCol] of DIRECTIONS) {
    let length = 1;
    let openEnds = 0;

    for (const direction of [-1, 1] as const) {
      let nextRow = row + dRow * direction;
      let nextCol = col + dCol * direction;

      while (
        nextRow >= 0 &&
        nextRow < BOARD_SIZE &&
        nextCol >= 0 &&
        nextCol < BOARD_SIZE &&
        board[nextRow][nextCol] === stone
      ) {
        length += 1;
        nextRow += dRow * direction;
        nextCol += dCol * direction;
      }

      if (
        nextRow >= 0 &&
        nextRow < BOARD_SIZE &&
        nextCol >= 0 &&
        nextCol < BOARD_SIZE &&
        board[nextRow][nextCol] === 0
      ) {
        openEnds += 1;
      }
    }

    score += getLineScore(length, openEnds);
  }

  const center = (BOARD_SIZE - 1) / 2;
  const distance = Math.abs(row - center) + Math.abs(col - center);
  return score + Math.max(0, 20 - distance);
}

export function getCpuMove(
  board: Board,
  difficulty: Difficulty,
  cpuStone: Exclude<Stone, 0>,
): Point {
  const candidates = getCandidateMoves(board);
  const playerStone: Exclude<Stone, 0> = cpuStone === 1 ? 2 : 1;

  for (const move of candidates) {
    const simulated = cloneBoard(board);
    simulated[move.row][move.col] = cpuStone;
    if (hasWinner(simulated, move.row, move.col)) {
      return move;
    }
  }

  for (const move of candidates) {
    const simulated = cloneBoard(board);
    simulated[move.row][move.col] = playerStone;
    if (hasWinner(simulated, move.row, move.col)) {
      return move;
    }
  }

  const scoredMoves: Array<Point & { score: number }> = [];

  for (const move of candidates) {
    const offensive = evaluatePoint(board, move.row, move.col, cpuStone);
    const defensive = evaluatePoint(board, move.row, move.col, playerStone);
    let score = offensive * 1.1 + defensive;

    if (difficulty === 'high') {
      score += offensive * 0.35 + defensive * 0.25;
    } else if (difficulty === 'low') {
      score *= 0.82;
      score += Math.random() * 1800;
    } else {
      score += Math.random() * 300;
    }

    scoredMoves.push({ ...move, score });
  }

  scoredMoves.sort((left, right) => right.score - left.score);

  if (difficulty === 'high') {
    return scoredMoves[0];
  }

  if (difficulty === 'medium') {
    return scoredMoves[Math.min(scoredMoves.length - 1, Math.floor(Math.random() * 2))];
  }

  return scoredMoves[Math.min(scoredMoves.length - 1, Math.floor(Math.random() * 4))];
}
