import { useContext } from 'react';
import { winnerContext } from './winnerContext'; // Adjust the import path if necessary

const WinnerDisplay = () => {
  // Access the 'bigWinner' state from the context
  const { bigWinner } = useContext(winnerContext);

  // Determine what text to display
  const displayText = bigWinner !== "placeholder" 
    ? `Winner: ${bigWinner}` 
    : "No Winner Yet";

  // Determine the color for the winner
  const winnerColor = bigWinner === "X" 
    ? "text-blue-500" 
    : bigWinner === "O" 
    ? "text-red-500" 
    : "text-gray-500";

  return (
    <div className="text-center my-2">
      <h3 className={`text-xl font-semibold ${winnerColor}`}>
        {displayText}
      </h3>
    </div>
  );
};

export default WinnerDisplay;