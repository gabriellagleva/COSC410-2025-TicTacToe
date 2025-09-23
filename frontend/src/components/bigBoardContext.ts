// AppContext.ts
import { createContext } from 'react';

// Define the type for the context's value
export type bigBoardContextType = {
    bigBoardID: string
    setbigBoardID: (bigBoardID: string) => void;
};

// Create the context with a default value
export const bigBoardContext = createContext<bigBoardContextType>({
    bigBoardID: "placeholder",
    setbigBoardID: () => { },
});