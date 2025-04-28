import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <p className="text-red-600 bg-red-100 border border-red-400 p-2 rounded my-4">
      Error: {message}
    </p>
  );
};

export default ErrorMessage; 