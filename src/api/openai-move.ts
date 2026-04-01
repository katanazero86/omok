import OpenAI from 'openai';
import {
  BOARD_SIZE,
  cloneBoard,
  getCpuMove,
  hasWinner,
  isBoardFull,
  type Board,
  type Difficulty,
  type RuleMode,
  type Stone,
  validateMove,
} from '../game/omok';

type StoneChoice = 'black' | 'white';
type Move = { row: number; col: number };

function getPlayerStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 1 : 2;
}

function getOpponentStone(choice: StoneChoice): Exclude<Stone, 0> {
  return choice === 'black' ? 2 : 1;
}

function serializeBoard(board: Board): string {
  return board
    .map((row) =>
      row
        .map((cell) => {
          if (cell === 0) return '.';
          if (cell === 1) return 'B';
          return 'W';
        })
        .join(' '),
    )
    .join('\n');
}

function isLegalMove(
  board: Board,
  move: Move,
  stone: Exclude<Stone, 0>,
  ruleMode: RuleMode,
) {
  return validateMove(board, move.row, move.col, stone, ruleMode).valid;
}

function findForcedMove(
  board: Board,
  stone: Exclude<Stone, 0>,
  ruleMode: RuleMode,
): Move | null {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!validateMove(board, row, col, stone, ruleMode).valid) {
        continue;
      }

      const nextBoard = cloneBoard(board);
      nextBoard[row][col] = stone;

      if (hasWinner(nextBoard, row, col, ruleMode)) {
        return { row, col };
      }
    }
  }

  return null;
}

function collectLegalMoves(
  board: Board,
  stone: Exclude<Stone, 0>,
  ruleMode: RuleMode,
): Move[] {
  const legalMoves: Move[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (validateMove(board, row, col, stone, ruleMode).valid) {
        legalMoves.push({ row, col });
      }
    }
  }

  return legalMoves;
}

export async function requestGptMove(
  board: Board,
  stoneChoice: StoneChoice,
  ruleMode: RuleMode,
): Promise<Move> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not configured.');
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== 0 && hasWinner(board, row, col, ruleMode)) {
        throw new Error('The game is already finished.');
      }
    }
  }

  if (isBoardFull(board)) {
    throw new Error('There are no legal moves left.');
  }

  if (board.every((row) => row.every((cell) => cell === 0))) {
    return { row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) };
  }

  const playerStone = getPlayerStone(stoneChoice);
  const opponentStone = getOpponentStone(stoneChoice);
  const model = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-5.4-mini';
  const ruleInstructions =
    ruleMode === 'free'
      ? [
          'Rule mode is free-style omok.',
          'Both black and white may win with five or more in a row.',
          'There are no forbidden moves in free-style omok.',
        ]
      : [
          'Rules (Renju):',
          'Black has forbidden moves (fouls):',
          '- Double three (33) is forbidden',
          '- Double four (44) is forbidden',
          '- Overline (6 or more) is forbidden',
          'White has no forbidden moves.',
        ];

  const immediateWin = findForcedMove(board, opponentStone, ruleMode);
  if (immediateWin) {
    return immediateWin;
  }

  const immediateBlock = findForcedMove(board, playerStone, ruleMode);
  if (immediateBlock && isLegalMove(board, immediateBlock, opponentStone, ruleMode)) {
    return immediateBlock;
  }

  const legalMoves = collectLegalMoves(board, opponentStone, ruleMode);

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: [
            'You are an Omok (Gomoku or Five-in-a-row) champion AI.',
            `Board size is ${BOARD_SIZE}x${BOARD_SIZE}.`,
            `You are ${opponentStone === 1 ? 'black(B)' : 'white(W)'}.`,
            `Opponent is ${playerStone === 1 ? 'black(B)' : 'white(W)'}.`,
            ...ruleInstructions,
            'Decision order:',
            '1. If you have an immediate winning legal move, choose it.',
            '2. Otherwise, if the opponent has an immediate winning move, block it if possible.',
            '3. In renju, if you are black, never choose a forbidden move.',
            '4. Choose only from the legal_moves provided by the user.',
            '5. Among legal moves, choose the strongest and most optimal move for the current board.',
            '6. Respond within 10 seconds.',
            '7. Return only JSON matching the schema.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              rule_mode: ruleMode,
              you_are: opponentStone === 1 ? 'black' : 'white',
              your_stone: opponentStone === 1 ? 'B' : 'W',
              opponent_is: playerStone === 1 ? 'black' : 'white',
              opponent_stone: playerStone === 1 ? 'B' : 'W',
              board: serializeBoard(board),
              legal_moves: legalMoves,
              immediate_winning_move: immediateWin,
              immediate_blocking_move: immediateBlock,
              instruction: 'Return the next move as only JSON.',
            },
            null,
            2,
          ),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'omok_move',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              row: { type: 'integer', minimum: 0, maximum: BOARD_SIZE - 1 },
              col: { type: 'integer', minimum: 0, maximum: BOARD_SIZE - 1 },
            },
            required: ['row', 'col'],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI did not return a move.');
    }

    const move = JSON.parse(content) as Move;
    if (!isLegalMove(board, move, opponentStone, ruleMode)) {
      return getCpuMove(board, 'high' as Difficulty, opponentStone, ruleMode);
    }

    return move;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenAI move request failed.';
    throw new Error(message);
  }
}
