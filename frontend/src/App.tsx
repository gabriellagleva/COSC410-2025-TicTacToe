import TicTacToe from "@/components/TicTacToe";
import { createContext } from "react";
import { useContext } from 'react';
import { moveContext } from './components/moveContext';
import { activeBoardContext } from "./components/ActiveBoardContext"
import { useState } from 'react';

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

export default function App() {
  const MyContext = createContext('default value');

  return (
    <div className="min-h-screen pt-10 border">
      <AppProviderMove>
        <AppProviderActiveBoard>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg border border-gray-2004">
            
            <TicTacToe gameID={0} />
            <TicTacToe gameID={1} />
            <TicTacToe gameID={2} />
            <TicTacToe gameID={3} />
            <TicTacToe gameID={4} />
            <TicTacToe gameID={5} />
            <TicTacToe gameID={6} />
            <TicTacToe gameID={7} />
            <TicTacToe gameID={8} />

          </div>
          <div className="text-center mt-4">
            <button className="rounded-2xl px-4 py-2">
              {/* New Game  Ask about new game button */}
            </button>
          </div>
        </AppProviderActiveBoard>
      </AppProviderMove>
    </div >
  );
}
