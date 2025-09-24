import React from 'react';

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  gameID: number;
  board: Cell[];
  winner: Player | null;
  isDraw: boolean;
  loading: boolean;
  active: boolean;
  onCellClick: (index: number) => void;
};

export default function TicTacToe({ gameID, board, winner, isDraw, loading, active, onCellClick }: Props) {
  if (gameID === 9) {
    return null;
  }

  if (winner === "X") {
    return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>X</div>;
  }
  if (winner === "O") {
    return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>O</div>;
  }
  if (isDraw) {
    return <div className='aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center'>D</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 border">
      {board.map((c, i) => (
        <button
          key={i}
          className={"aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center disabled:opacity-10"}
          onClick={() => onCellClick(i)}
          aria-label={`cell-${i}-${gameID}`}
          disabled={loading || c !== null || !active}
        >
          {c}
        </button>
      ))}
    </div>
  );
}