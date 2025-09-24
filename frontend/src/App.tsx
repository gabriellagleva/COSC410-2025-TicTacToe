import TicTacToe from "@/components/TicTacToe";
import { useContext, useEffect, useMemo, useState } from "react";
import { moveContext } from './components/moveContext';
import { activeBoardContext } from "./components/ActiveBoardContext";
import { bigBoardContext } from "./components/bigBoardContext";
import PlayerTurn from "./components/playerturn";
import { winnerContext } from "./components/winnerContext";
import WinnerDisplay from "./components/WinnerDisplay"; // 1. Import the new component

// --- Your Provider components ---
export const AppProviderMove = ({ children }: { children: React.ReactNode }) => {
  const [move, setMove] = useState("X");
  return (
    <moveContext.Provider value={{ move, setMove }}>
      {children}
    </moveContext.Provider>
  );
};

export const AppProviderActiveBoard = ({ children }: { children: React.ReactNode }) => {
  const [activeBoard, setActiveBoard] = useState<number | "all">("all");
  return (
    <activeBoardContext.Provider value={{ activeBoard, setActiveBoard }}>
      {children}
    </activeBoardContext.Provider>
  );
};

export const AppProviderBigBoard = ({ children }: { children: React.ReactNode }) => {
  const [bigBoardID, setbigBoardID] = useState<string>("placeholder");
  return (
    <bigBoardContext.Provider value={{ bigBoardID, setbigBoardID }}>
      {children}
    </bigBoardContext.Provider>
  );
};

export const AppProviderWinner = ({ children }: { children: React.ReactNode }) => {
  const [bigWinner, setBigWinner] = useState<string>("placeholder"); // Initial state
  return (
    <winnerContext.Provider value={{ bigWinner, setBigWinner }}>
      {children}
    </winnerContext.Provider>
  );
};

// ----- Types shared with backend -----
type Player = "X" | "O";
type Cell = Player | null;

type GameStateDTO = {
  id: string;
  board: Cell[];
  current_player: Player;
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

function GameBoard() {
  const { move, setMove } = useContext(moveContext);
  const { activeBoard, setActiveBoard } = useContext(activeBoardContext);
  const { bigBoardID, setbigBoardID } = useContext(bigBoardContext);
  const { bigWinner, setBigWinner } = useContext(winnerContext);

  const [games, setGames] = useState<Record<number, GameStateDTO | null>>({});
  const [loadingByBoard, setLoadingByBoard] = useState<Record<number, boolean>>({});

  function isMiniBoardCompleted(state: GameStateDTO | null | undefined): boolean {
    if (!state) return false;
    if (state.winner) return true;
    if (state.is_draw) return true;
    return state.board.every((c) => c !== null);
  }

  useEffect(() => {
    let canceled = false;

    async function createGame(): Promise<GameStateDTO> {
      const r = await fetch(`${API_BASE}/tictactoe/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_player: "X" }),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      return r.json();
    }

    async function bootstrap() {
      try {
        const big = await createGame();
        if (canceled) return;
        setGames((prev) => ({ ...prev, 9: big }));
        setbigBoardID(big.id);

        const results = await Promise.all(
          Array.from({ length: 9 }, () => createGame())
        );
        if (canceled) return;
        const next: Record<number, GameStateDTO | null> = { 9: big };
        results.forEach((gs, idx) => { next[idx] = gs; });
        setGames(next);
      } catch (e) {
        // optional: handle bootstrap error
      }
    }

    bootstrap();
    return () => { canceled = true; };
  }, [setbigBoardID]);

  const setBoardLoading = (id: number, v: boolean) =>
    setLoadingByBoard((prev) => ({ ...prev, [id]: v }));

  async function playMove(boardId: number, index: number): Promise<GameStateDTO> {
    const gs = games[boardId];
    if (!gs) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${gs.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move, index }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    const next = await r.json();
    setMove(move === "X" ? "O" : "X");
    return next;
  }

  async function reportMiniWinToBigBoard(winner: Player, boardId: number) {
    if (!bigBoardID) return;
    await fetch(`${API_BASE}/tictactoe/${bigBoardID}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: winner, index: boardId }),
    });
  }

  async function refreshBigBoardAndValidateNext(spaceID: number) {
    if (!bigBoardID) return;
    const r = await fetch(`${API_BASE}/tictactoe/${bigBoardID}`, { method: "GET" });
    if (!r.ok) return;
    const bigState: GameStateDTO = await r.json();

    if (bigState.winner === "X") setBigWinner("X");
    else if (bigState.winner === "O") setBigWinner("O");
    else if (bigState.is_draw === true) setBigWinner("Draw");

    setGames((prev) => ({ ...prev, 9: bigState }));
  }

  const handleCellClick = async (cellIndex: number, boardId: number) => {
    const gs = games[boardId];
    if (!gs) return;

    if (loadingByBoard[boardId]) return;
    if (gs.winner || gs.is_draw || gs.board[cellIndex] !== null) return;
    if (!(activeBoard === boardId || activeBoard === "all")) return;
    if (bigWinner !== "placeholder") return;

    setBoardLoading(boardId, true);
    try {
      const next = await playMove(boardId, cellIndex);

      const destinationBoardId = cellIndex;
      if (next.winner) {
        await reportMiniWinToBigBoard(next.winner, boardId);
      }

      const destinationState = games[destinationBoardId];
      const destinationCompleted = isMiniBoardCompleted(destinationState);
      setActiveBoard(destinationCompleted ? "all" : destinationBoardId);

      await refreshBigBoardAndValidateNext(cellIndex);

      setGames((prev) => ({ ...prev, [boardId]: next }));
    } catch (e) {
      // optional
    } finally {
      setBoardLoading(boardId, false);
    }
  };

  const miniBoards = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  return (
    <>
      <PlayerTurn />
      <WinnerDisplay />
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg border border-gray-2004">
        {miniBoards.map((id) => (
          <TicTacToe
            key={id}
            gameID={id}
            board={games[id]?.board ?? [null, null, null, null, null, null, null, null, null]}
            winner={games[id]?.winner ?? null}
            isDraw={games[id]?.is_draw ?? false}
            loading={!!loadingByBoard[id]}
            active={activeBoard === "all" || activeBoard === id}
            onCellClick={(i) => handleCellClick(i, id)}
          />
        ))}
      </div>
      <div className="text-center mt-4">
        <button className="rounded-2xl px-4 py-2" onClick={() => window.location.reload()}>
          New Game
        </button>
      </div>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen pt-10 border">
      <AppProviderMove>
        <AppProviderActiveBoard>
          <AppProviderBigBoard>
            {/* 2. Wrap everything in the Winner Provider */}
            <AppProviderWinner>
              <GameBoard />
            </AppProviderWinner>
          </AppProviderBigBoard>
        </AppProviderActiveBoard>
      </AppProviderMove>
    </div>
  );
}