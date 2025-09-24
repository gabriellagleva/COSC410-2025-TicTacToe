import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Basic game state type used by handlers
type Player = "X" | "O";
type Cell = Player | null;

type GameState = {
  id: string;
  board: Cell[];
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// In-memory DB of games keyed by id
const games = new Map<string, GameState>();

// ID allocator: first is BIG board, then G0..G8
let createCount = 0;
function allocateId(): string {
  if (createCount === 0) return "BIG";
  return `G${createCount - 1}`; // 0..8
}

function makeEmptyState(id: string): GameState {
  return {
    id,
    board: [null, null, null, null, null, null, null, null, null],
    current_player: "X",
    winner: null,
    is_draw: false,
    status: "X's turn",
  };
}

// Deterministic draw script for mini-board G0 (board index 0)
// Sequence of indices: 0,1,2,3,5,4,6,8,7 → draw
const drawSequence = [0, 1, 2, 3, 5, 4, 6, 8, 7];
let drawStep = -1; // per-test lifecycle

export const server = setupServer(
  // Create game(s)
  http.post("http://localhost:8000/tictactoe/new", async () => {
    const id = allocateId();
    createCount += 1;
    const state = makeEmptyState(id);
    games.set(id, state);
    return HttpResponse.json(state);
  }),

  // Get game state (used by App to refresh big board)
  http.get("http://localhost:8000/tictactoe/:id", async ({ params }) => {
    const id = String(params.id);
    const found = games.get(id) ?? makeEmptyState(id);
    return HttpResponse.json(found);
  }),

  // Make move
  http.post("http://localhost:8000/tictactoe/:id/move", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as any;
    const index: number = body?.index as number;
    const move: Player = body?.move as Player;

    // BIG board: accept and echo without affecting tests
    if (id === "BIG") {
      const s = games.get(id) ?? makeEmptyState(id);
      return HttpResponse.json(s);
    }

    // Only G0 is scripted for draw; others no-op reject
    if (id !== "G0") {
      return HttpResponse.json({ detail: `No script for ${id}` }, { status: 400 });
    }

    // Enforce expected sequence
    const expected = drawSequence[drawStep + 1];
    if (expected === undefined || index !== expected) {
      return HttpResponse.json(
        { detail: `Unexpected move: got ${index}, expected ${expected}` },
        { status: 400 }
      );
    }

    // Advance scripted state
    drawStep += 1;
    const prev = games.get(id) ?? makeEmptyState(id);
    const nextBoard = [...prev.board];
    nextBoard[index] = move;

    // Compute terminal status at end of script
    const isTerminal = drawStep === drawSequence.length - 1;
    const next: GameState = {
      ...prev,
      board: nextBoard,
      current_player: move === "X" ? "O" : "X",
      winner: null,
      is_draw: isTerminal,
      status: isTerminal ? "Draw" : `${move === "X" ? "O" : "X"}'s turn`,
    };
    games.set(id, next);
    return HttpResponse.json(next);
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // reset in-memory state between tests
  games.clear();
  createCount = 0;
  drawStep = -1;
});
afterAll(() => server.close());
