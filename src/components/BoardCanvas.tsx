import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE, CELL_SIZE, GRID_OFFSET, type Board, type Stone } from '../game/omok';

type BoardCanvasProps = {
  board: Board;
  disabled: boolean;
  lastMove: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  previewStone: Exclude<Stone, 0>;
};

type Point = { row: number; col: number };

const CANVAS_SIZE = GRID_OFFSET * 2 + CELL_SIZE * (BOARD_SIZE - 1);
const BOARD_COLOR = 0xc78a45;
const BOARD_SHADOW = 0x86521f;
const GRID_COLOR = 0x4a2b17;
const HIGHLIGHT_COLOR = 0xd92b2b;

function drawStonePixel(
  graphics: Graphics,
  x: number,
  y: number,
  stone: Exclude<Stone, 0>,
  alpha = 1,
  scale = 1,
) {
  const radius = 11 * scale;
  const shadowOffset = 1.5 * scale;
  const baseColor = stone === 1 ? 0x171717 : 0xf6f3ea;
  const edgeColor = stone === 1 ? 0x090909 : 0xd6cec0;
  const innerColor = stone === 1 ? 0x2f2f2f : 0xffffff;
  const highlightColor = stone === 1 ? 0x757575 : 0xffffff;

  graphics.beginFill(0x000000, alpha * 0.14);
  graphics.drawCircle(x + shadowOffset, y + shadowOffset + 0.5, radius);
  graphics.endFill();

  graphics.beginFill(edgeColor, alpha);
  graphics.drawCircle(x, y, radius);
  graphics.endFill();

  graphics.beginFill(baseColor, alpha);
  graphics.drawCircle(x, y - 0.5, radius - 1.2);
  graphics.endFill();

  graphics.beginFill(innerColor, alpha * (stone === 1 ? 0.22 : 0.85));
  graphics.drawCircle(x - 1.3 * scale, y - 2.1 * scale, radius - 4.8 * scale);
  graphics.endFill();

  graphics.beginFill(highlightColor, alpha * (stone === 1 ? 0.35 : 0.95));
  graphics.drawCircle(x - 3.8 * scale, y - 4.8 * scale, 2.6 * scale);
  graphics.endFill();
}

function drawLastMoveMarker(graphics: Graphics, x: number, y: number) {
  graphics.beginFill(0xfff8ef);
  graphics.drawCircle(x, y, 4.8);
  graphics.endFill();
  graphics.beginFill(HIGHLIGHT_COLOR);
  graphics.drawCircle(x, y, 3.1);
  graphics.endFill();
}

function renderBoard(
  stage: Container,
  board: Board,
  lastMove: { row: number; col: number } | null,
  previewMove: Point | null,
  placementPulse: number,
  previewStone: Exclude<Stone, 0>,
  disabled: boolean,
  onCellSelect: (row: number, col: number) => void,
  onHoverCell: (point: Point | null) => void,
) {
  stage.removeChildren();

  const boardLayer = new Graphics();
  boardLayer.beginFill(BOARD_SHADOW);
  boardLayer.drawRect(14, 18, CANVAS_SIZE - 8, CANVAS_SIZE - 8);
  boardLayer.endFill();

  boardLayer.beginFill(BOARD_COLOR);
  boardLayer.drawRect(8, 8, CANVAS_SIZE - 16, CANVAS_SIZE - 16);
  boardLayer.endFill();

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const offset = GRID_OFFSET + index * CELL_SIZE;
    boardLayer.moveTo(GRID_OFFSET, offset);
    boardLayer.lineTo(CANVAS_SIZE - GRID_OFFSET, offset);
    boardLayer.moveTo(offset, GRID_OFFSET);
    boardLayer.lineTo(offset, CANVAS_SIZE - GRID_OFFSET);
    boardLayer.stroke({ color: GRID_COLOR, width: 2 });
  }

  const starIndices = [3, 9, 15];
  for (const row of starIndices) {
    for (const col of starIndices) {
      boardLayer.beginFill(GRID_COLOR);
      boardLayer.drawRect(
        GRID_OFFSET + col * CELL_SIZE - 3,
        GRID_OFFSET + row * CELL_SIZE - 3,
        6,
        6,
      );
      boardLayer.endFill();
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const stone = board[row][col];
      if (!stone) {
        continue;
      }

      const x = GRID_OFFSET + col * CELL_SIZE;
      const y = GRID_OFFSET + row * CELL_SIZE;
      const isLastMove = lastMove?.row === row && lastMove.col === col;
      drawStonePixel(
        boardLayer,
        x,
        y,
        stone,
        1,
        isLastMove ? placementPulse : 1,
      );

      if (isLastMove && placementPulse > 1.01) {
        boardLayer.beginFill(0xffd7a8, 0.18 * (placementPulse - 1) * 6);
        boardLayer.drawCircle(x, y, 10 + (placementPulse - 1) * 28);
        boardLayer.endFill();
      }

      if (isLastMove) {
        drawLastMoveMarker(boardLayer, x, y);
      }
    }
  }

  if (previewMove && board[previewMove.row][previewMove.col] === 0) {
    drawStonePixel(
      boardLayer,
      GRID_OFFSET + previewMove.col * CELL_SIZE,
      GRID_OFFSET + previewMove.row * CELL_SIZE,
      previewStone,
      0.35,
    );
  }
  const hitLayer = new Graphics();
  hitLayer.beginFill(0xffffff, 0.001);
  hitLayer.drawRect(
    GRID_OFFSET - CELL_SIZE / 2,
    GRID_OFFSET - CELL_SIZE / 2,
    CELL_SIZE * (BOARD_SIZE - 1) + CELL_SIZE,
    CELL_SIZE * (BOARD_SIZE - 1) + CELL_SIZE,
  );
  hitLayer.endFill();
  hitLayer.eventMode = disabled ? 'none' : 'static';
  hitLayer.cursor = disabled ? 'default' : 'pointer';
  hitLayer.hitArea = new Rectangle(
    GRID_OFFSET - CELL_SIZE / 2,
    GRID_OFFSET - CELL_SIZE / 2,
    CELL_SIZE * (BOARD_SIZE - 1) + CELL_SIZE,
    CELL_SIZE * (BOARD_SIZE - 1) + CELL_SIZE,
  );
  hitLayer.on('pointerdown', (event) => {
    if (disabled) {
      return;
    }

    const position = event.getLocalPosition(stage);
    const col = Math.round((position.x - GRID_OFFSET) / CELL_SIZE);
    const row = Math.round((position.y - GRID_OFFSET) / CELL_SIZE);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return;
    }

    onCellSelect(row, col);
  });
  hitLayer.on('pointermove', (event) => {
    if (disabled) {
      onHoverCell(null);
      return;
    }

    const position = event.getLocalPosition(stage);
    const col = Math.round((position.x - GRID_OFFSET) / CELL_SIZE);
    const row = Math.round((position.y - GRID_OFFSET) / CELL_SIZE);

    if (
      row < 0 ||
      row >= BOARD_SIZE ||
      col < 0 ||
      col >= BOARD_SIZE ||
      board[row][col] !== 0
    ) {
      onHoverCell(null);
      return;
    }

    onHoverCell({ row, col });
  });
  hitLayer.on('pointerout', () => {
    onHoverCell(null);
  });

  stage.addChild(boardLayer);
  stage.addChild(hitLayer);
}

export function BoardCanvas({
  board,
  disabled,
  lastMove,
  onCellSelect,
  previewStone,
}: BoardCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [previewMove, setPreviewMove] = useState<Point | null>(null);
  const [placementPulse, setPlacementPulse] = useState(1);

  useEffect(() => {
    if (!lastMove) {
      setPlacementPulse(1);
      return;
    }

    const duration = 220;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const wave = Math.sin(progress * Math.PI);
      setPlacementPulse(1 + wave * 0.14);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        setPlacementPulse(1);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [lastMove]);

  useEffect(() => {
    if (disabled) {
      setPreviewMove(null);
    }
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const app = new Application();
      await app.init({
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        antialias: false,
        backgroundAlpha: 0,
        resolution: 1,
      });

      if (cancelled || !hostRef.current) {
        app.destroy(true);
        return;
      }

      hostRef.current.innerHTML = '';
      hostRef.current.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.imageRendering = 'pixelated';
      app.canvas.style.touchAction = 'none';
      appRef.current = app;
      renderBoard(
        app.stage,
        board,
        lastMove,
        previewMove,
        placementPulse,
        previewStone,
        disabled,
        onCellSelect,
        setPreviewMove,
      );
    };

    void setup();

    return () => {
      cancelled = true;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!appRef.current) {
      return;
    }

    renderBoard(
      appRef.current.stage,
      board,
      lastMove,
      previewMove,
      placementPulse,
      previewStone,
      disabled,
      onCellSelect,
      setPreviewMove,
    );
  }, [board, disabled, lastMove, onCellSelect, placementPulse, previewMove, previewStone]);

  return <div className="board-canvas" ref={hostRef} />;
}
