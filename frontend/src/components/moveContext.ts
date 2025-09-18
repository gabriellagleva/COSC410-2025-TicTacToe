import { createContext } from 'react';

// Create a context with a default value of 'light'
let moveContext = createContext<string>('X'); 

export default moveContext;