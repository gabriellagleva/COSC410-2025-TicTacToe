import React, { useContext, useState } from 'react';
import { moveContext } from './moveContext';
import { activeBoardContext } from "./ActiveBoardContext";
import { bigBoardContext } from './bigBoardContext';

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  gameID: number;
  onWin?: (winner: Player | "draw" | null) => void;
};

// ----- Backend DTOs -----
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



export default function TicTacToe({ gameID, onWin }: Props) {
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { move, setMove } = useContext(moveContext);

  const { activeBoard, setActiveBoard } = useContext(activeBoardContext);

  const { bigBoardID, setbigBoardID } = useContext(bigBoardContext);
  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const gs = await createGame();
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }

    }

    start();

    return () => {
      canceled = true;
    };
  }, []);

  // This new useEffect will run whenever 'state' or 'gameID' changes.
  React.useEffect(() => {
    // Check if state has been loaded and if it's the correct game board
    if (state && gameID === 9) {
      console.log("Setting bigBoardID with state ID:", state.id);
      setbigBoardID(state.id);
    }
  }, [state, gameID]); // Dependency array

  // Notify parent when result changes
  React.useEffect(() => {
    if (!state || !onWin) return;
    if (state.winner) onWin(state.winner);
    else if (state.is_draw) onWin("draw");
  }, [state?.winner, state?.is_draw]);

  async function createGame(): Promise<GameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starting_player: "X" }),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    let responsepare = await r.json()

    return responsepare;
  }

  async function checkValidSpace(spaceID: number | String) {
    console.log(`Check if ${spaceID} valid`)
    if (spaceID == "all") {
    }
    else {
      const r = await fetch(`${API_BASE}/tictactoe/${bigBoardID}`, {
        method: "GET",
      });

      if (!r.ok) {

        throw new Error(`HTTP error! status: ${r.status}`);
      }

      let parseresponse = await r.json();


      console.log(parseresponse)
      if (typeof spaceID === "number") {
        if (parseresponse.board[spaceID] != null) {
          setActiveBoard("all")
        }
      }

    }

  }

  async function reportMiniWin(winner: string) {
    console.log("miniwin reported at ")
    console.log(gameID)
    console.log(winner)
    let move = winner
    let index = gameID
    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${bigBoardID}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move, index }),
    });

  }

  async function playMove(index: number): Promise<GameStateDTO> {

    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move, index }),
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    console.log(move)
    if (move == "X") {
      setMove("O");
      console.log(bigBoardID)
    } else {
      setMove("X")
    }

    return r.json();
  }

  async function handleClick(i: number, gameID: number) {
    if (!state || loading) return;
    // Light client-side guard to avoid noisy 400s:
    if (state.winner || state.is_draw || state.board[i] !== null) return;

    setLoading(true);
    setError(null);
    try {
      const next = await playMove(i);
      if (next.winner != "X" && next.winner != "O" && next.is_draw == false) { //checks to make sure the game hasn't ended. Sets active board to all if it has
        setActiveBoard(i)
      }
      else {
        setActiveBoard("all")
        reportMiniWin(move)
      }
      checkValidSpace(i)
      setState(next);
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const gs = await createGame();
      setState(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
        <button className="rounded-2xl px-4 py-2 border" onClick={reset}>
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const { board, status } = state;

  const renderWinner = () => {
    if (gameID != 9) {
      if (state.winner === "X") {
        return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>X</div>;
      } else if (state.winner === "O") {
        return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>O</div>;
      } else if (state.is_draw) {
        return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>D</div>;
      }
      else if ((state.winner != null || state.is_draw) && activeBoard == gameID) {
        setActiveBoard("all")
      }
      else
        return (<div className="grid grid-cols-3 gap-2 border">
          {board.map((c, i) => (
            <button
              key={i}
              className={"aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center disabled:opacity-10"}
              onClick={() => handleClick(i, gameID)}
              aria-label={`cell-${i}-${gameID}`}
              disabled={loading || c !== null || state.winner !== null || state.is_draw || !(activeBoard == gameID || activeBoard == "all")}  //disables the buttons when the game is loading, a winner has been found, a draw has bappened, or the acitve board is different
            >
              {c}
            </button>
          ))}
        </div>
        )
      return null;
    };
  }


  return (
    renderWinner()
  );
}