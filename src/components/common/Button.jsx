import React from 'react';

const Button = ({ children, variant = 'primary', ...props }) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-secondary-600 text-white hover:bg-secondary-700",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
