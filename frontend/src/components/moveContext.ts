// AppContext.ts
import { createContext } from 'react';

// Define the type for the context's value
export type moveContextType = {
    move: string
    setMove: (move: string) => void;
};

// Create the context with a default value
export const moveContext = createContext<moveContextType>({
    move: 'X',
    setMove: () => { },
});