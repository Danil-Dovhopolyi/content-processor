import React from 'react';

interface ResultDisplayProps {
  result: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">LLM Result:</h3>
      <pre className="p-4 bg-gray-100 border border-gray-300 rounded text-sm whitespace-pre-wrap overflow-x-auto">
        {result}
      </pre>
    </div>
  );
};

export default ResultDisplay; 