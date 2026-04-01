export const BOARD_SIZE = 19;
export const CELL_SIZE = 28;
export const GRID_OFFSET = 32;

export type Stone = 0 | 1 | 2;
export type Player = 'player' | 'cpu';
export type GameResult = 'player' | 'cpu' | 'draw' | null;
export type Difficulty = 'low' | 'medium' | 'high';
export type RuleMode = 'free' | 'renju';
export type Board = Stone[][];
type Point = { row: number; col: number };

type MoveValidation = {
  valid: boolean;
  reason?: string;
};

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

const OPEN_FOUR_PATTERNS = ['.XXXX.', '.XXX.X.', '.XX.XX.', '.X.XXX.'];

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

export function hasWinner(
  board: Board,
  row: number,
  col: number,
  ruleMode: RuleMode = 'free',
): boolean {
  const stone = board[row][col];
  if (!stone) {
    return false;
  }

  return DIRECTIONS.some(([dRow, dCol]) => {
    const length = getLineLength(board, row, col, dRow, dCol, stone);

    if (ruleMode === 'renju' && stone === 1) {
      return length === 5;
    }

    return length >= 5;
  });
}

export function validateMove(
  board: Board,
  row: number,
  col: number,
  stone: Exclude<Stone, 0>,
  ruleMode: RuleMode = 'free',
): MoveValidation {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, reason: '보드 범위를 벗어난 착수입니다.' };
  }

  if (board[row][col] !== 0) {
    return { valid: false, reason: '이미 돌이 놓인 칸입니다.' };
  }

  if (ruleMode !== 'renju' || stone !== 1) {
    return { valid: true };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[row][col] = stone;

  if (isOverline(nextBoard, row, col, stone)) {
    return { valid: false, reason: '렌주룰에서는 흑돌의 장목이 금수입니다.' };
  }

  const openFourCount = countThreats(nextBoard, row, col, stone, 'openFour');
  if (openFourCount >= 2) {
    return { valid: false, reason: '렌주룰에서는 흑돌의 사사 금수가 허용되지 않습니다.' };
  }

  const openThreeCount = countThreats(nextBoard, row, col, stone, 'openThree');
  if (openThreeCount >= 2) {
    return { valid: false, reason: '렌주룰에서는 흑돌의 삼삼 금수가 허용되지 않습니다.' };
  }

  return { valid: true };
}

function getLineLength(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  stone: Stone,
) {
  return (
    1 +
    countDirection(board, row, col, dRow, dCol, stone) +
    countDirection(board, row, col, -dRow, -dCol, stone)
  );
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

function isOverline(board: Board, row: number, col: number, stone: Exclude<Stone, 0>) {
  return DIRECTIONS.some(([dRow, dCol]) => getLineLength(board, row, col, dRow, dCol, stone) >= 6);
}

function buildDirectionalLine(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  stone: Exclude<Stone, 0>,
) {
  let line = '';

  for (let offset = -4; offset <= 4; offset += 1) {
    const nextRow = row + dRow * offset;
    const nextCol = col + dCol * offset;

    if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) {
      line += '#';
      continue;
    }

    const cell = board[nextRow][nextCol];
    if (cell === 0) {
      line += '.';
    } else if (cell === stone) {
      line += 'X';
    } else {
      line += 'O';
    }
  }

  return line;
}

function hasCenteredPattern(line: string, patterns: string[]) {
  const center = 4;

  return patterns.some((pattern) => {
    for (let start = 0; start <= line.length - pattern.length; start += 1) {
      if (start > center || start + pattern.length <= center) {
        continue;
      }

      if (line.slice(start, start + pattern.length) === pattern) {
        return true;
      }
    }

    return false;
  });
}

function createsOpenFourInDirection(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  stone: Exclude<Stone, 0>,
) {
  const line = buildDirectionalLine(board, row, col, dRow, dCol, stone);
  return hasCenteredPattern(line, OPEN_FOUR_PATTERNS);
}

function createsOpenThreeInDirection(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  stone: Exclude<Stone, 0>,
) {
  if (createsOpenFourInDirection(board, row, col, dRow, dCol, stone)) {
    return false;
  }

  for (let offset = -4; offset <= 4; offset += 1) {
    const nextRow = row + dRow * offset;
    const nextCol = col + dCol * offset;

    if (
      nextRow < 0 ||
      nextRow >= BOARD_SIZE ||
      nextCol < 0 ||
      nextCol >= BOARD_SIZE ||
      board[nextRow][nextCol] !== 0
    ) {
      continue;
    }

    const simulated = cloneBoard(board);
    simulated[nextRow][nextCol] = stone;

    if (createsOpenFourInDirection(simulated, row, col, dRow, dCol, stone)) {
      return true;
    }
  }

  return false;
}

function countThreats(
  board: Board,
  row: number,
  col: number,
  stone: Exclude<Stone, 0>,
  kind: 'openThree' | 'openFour',
) {
  let count = 0;

  for (const [dRow, dCol] of DIRECTIONS) {
    const matched =
      kind === 'openFour'
        ? createsOpenFourInDirection(board, row, col, dRow, dCol, stone)
        : createsOpenThreeInDirection(board, row, col, dRow, dCol, stone);

    if (matched) {
      count += 1;
    }
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

function getLegalCandidateMoves(
  board: Board,
  stone: Exclude<Stone, 0>,
  ruleMode: RuleMode,
) {
  const legalCandidates = getCandidateMoves(board).filter((move) =>
    validateMove(board, move.row, move.col, stone, ruleMode).valid,
  );

  if (legalCandidates.length > 0) {
    return legalCandidates;
  }

  const fallback: Point[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (validateMove(board, row, col, stone, ruleMode).valid) {
        fallback.push({ row, col });
      }
    }
  }

  return fallback;
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
  ruleMode: RuleMode = 'free',
): Point {
  const candidates = getLegalCandidateMoves(board, cpuStone, ruleMode);
  const playerStone: Exclude<Stone, 0> = cpuStone === 1 ? 2 : 1;

  for (const move of candidates) {
    const simulated = cloneBoard(board);
    simulated[move.row][move.col] = cpuStone;
    if (hasWinner(simulated, move.row, move.col, ruleMode)) {
      return move;
    }
  }

  for (const move of candidates) {
    if (!validateMove(board, move.row, move.col, playerStone, ruleMode).valid) {
      continue;
    }

    const simulated = cloneBoard(board);
    simulated[move.row][move.col] = playerStone;
    if (hasWinner(simulated, move.row, move.col, ruleMode)) {
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
