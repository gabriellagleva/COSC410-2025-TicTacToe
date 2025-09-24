import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";

type Player = "X" | "O";
type Cell = Player | null;

function renderBoard(
  board: Cell[] = [null, null, null, null, null, null, null, null, null],
  opts: {
    gameID?: number;
    winner?: Player | null;
    isDraw?: boolean;
    loading?: boolean;
    active?: boolean;
    onCellClick?: (i: number) => void;
  } = {}
) {
  const {
    gameID = 0,
    winner = null,
    isDraw = false,
    loading = false,
    active = true,
    onCellClick = vi.fn(),
  } = opts;

  render(
    <TicTacToe
      gameID={gameID}
      board={board}
      winner={winner}
      isDraw={isDraw}
      loading={loading}
      active={active}
      onCellClick={onCellClick}
    />
  );
  return { onCellClick };
}

describe("TicTacToe (presentational)", () => {
  it("renders cells and forwards clicks when enabled", () => {
    const { onCellClick } = renderBoard();
    const c0 = screen.getByLabelText("cell-0-0");
    expect(c0).toBeEnabled();
    fireEvent.click(c0);
    expect(onCellClick).toHaveBeenCalledWith(0);
  });

  it("disables occupied cells", () => {
    renderBoard(["X", null, null, null, null, null, null, null, null]);
    const c0 = screen.getByLabelText("cell-0-0");
    expect(c0).toBeDisabled();
  });

  it("disables all cells when loading", () => {
    renderBoard(undefined, { loading: true });
    const c0 = screen.getByLabelText("cell-0-0");
    expect(c0).toBeDisabled();
  });

  it("disables all cells when inactive", () => {
    renderBoard(undefined, { active: false });
    const c0 = screen.getByLabelText("cell-0-0");
    expect(c0).toBeDisabled();
  });

  it("renders winner X view", () => {
    renderBoard(undefined, { winner: "X" });
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders winner O view", () => {
    renderBoard(undefined, { winner: "O" });
    expect(screen.getByText("O")).toBeInTheDocument();
  });

  it("renders draw view as 'D'", () => {
    renderBoard(undefined, { isDraw: true });
    expect(screen.getByText("D")).toBeInTheDocument();
  });
});
