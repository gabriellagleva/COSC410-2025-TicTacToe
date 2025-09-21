import TicTacToe from "@/components/TicTacToe";
import { createContext } from "react";
import { useContext } from 'react';
import { moveContext } from './components/moveContext';
import { useState } from 'react';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [move, setMove] = useState("X");

  return (
    <moveContext.Provider value={{ move, setMove }}>
      {children}
    </moveContext.Provider>
  );
};

export default function App() {
  const MyContext = createContext('default value');

  return (
    <div className="min-h-screen pt-10 border"> {/* Added pt-10 to move grid down from top */}
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg border border-gray-2004">
        <AppProvider>
          <TicTacToe gameID={1} active={false} />
          <TicTacToe gameID={2} active={true} />
          <TicTacToe gameID={3} active={true} />
          <TicTacToe gameID={4} active={true} />
          <TicTacToe gameID={5} active={true} />
          <TicTacToe gameID={6} active={true} />
          <TicTacToe gameID={7} active={true} />
          <TicTacToe gameID={8} active={true} />
          <TicTacToe gameID={9} active={true} />
        </AppProvider>
      </div>
      <div className="text-center mt-4"> {/* Increased margin-top */}
        <button className="rounded-2xl px-4 py-2">
          New Game
        </button>
      </div>
  </div >
);
}
