import React from 'react';

const Alert = ({ type, message }) => {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';

  return (
    <div className={`${bgColor} border-l-4 p-4 mb-4 rounded`} role="alert">
      <p>{message}</p>
    </div>
  );
};

export default Alert;
