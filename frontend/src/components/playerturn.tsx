import { useContext } from 'react';
import { moveContext } from './moveContext'; // Adjust the import path if necessary

const PlayerTurn = () => {
  // Access the 'move' state from the context
  const { move } = useContext(moveContext);

  return (
    <div className="text-center my-4">
      <h2 className="text-2xl font-bold">
        Current Turn: <span className={move === "X" ? "text-blue-500" : "text-red-500"}>{move}</span>
      </h2>
    </div>
  );
};

export default PlayerTurn;