// AppContext.ts
import { createContext } from 'react';

// Define the type for the context's value
export type winnerContextType = {
    bigWinner: string
    setBigWinner: (winner: string) => void;
};

// Create the context with a default value
export const winnerContext = createContext<winnerContextType>({
    bigWinner: "No One",
    setBigWinner: () => { },
});