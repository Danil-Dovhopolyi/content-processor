import React from 'react';

interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  isLoading: boolean;
  fileSelected: boolean;
}

const buttonStyle = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed";
const inputStyle = "border border-gray-300 rounded px-2 py-1";

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onProcess, isLoading, fileSelected }) => {
  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="pdf-upload" className="font-medium">Upload PDF:</label>
      <input
        type="file"
        id="pdf-upload"
        accept=".pdf"
        onChange={onFileChange}
        className={`${inputStyle} file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
      />
      <button onClick={onProcess} disabled={!fileSelected || isLoading} className={buttonStyle}>
        {isLoading ? 'Processing...' : 'Process with GROBID'}
      </button>
    </div>
  );
};

export default FileUpload; 