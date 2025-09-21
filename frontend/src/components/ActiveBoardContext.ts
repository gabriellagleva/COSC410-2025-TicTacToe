// AppContext.ts
import { createContext } from 'react';

// Define the type for the context's value
export type activeBoardContextType = {
    activeBoard: number | string
    setActiveBoard: (board: number | "all") => void;
};

// Create the context with a default value
export const activeBoardContext = createContext<activeBoardContextType>({
    activeBoard: 1,
    setActiveBoard: () => { },
});