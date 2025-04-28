import React from 'react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onProcess: () => void;
  isLoading: boolean;
  canProcess: boolean;
}

// Reusable styles
const buttonStyle = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed";
const inputStyle = "border border-gray-300 rounded px-2 py-1";

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, onProcess, isLoading, canProcess }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Enter Prompt for LLM:</h3>
      <textarea
        rows={5}
        value={prompt}
        onChange={onPromptChange}
        placeholder="Enter your prompt here (e.g., 'Summarize the abstract and conclusion')..."
        className={`${inputStyle} w-full focus:ring-blue-500 focus:border-blue-500`}
      />
      <button onClick={onProcess} disabled={!canProcess || isLoading} className={buttonStyle}>
        {isLoading ? 'Processing...' : 'Process with LLM'}
      </button>
    </div>
  );
};

export default PromptInput; 