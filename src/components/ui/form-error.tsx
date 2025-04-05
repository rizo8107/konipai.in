import React from 'react';

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export function FormError({ children, className, ...props }: FormErrorProps & React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p 
      className={`text-sm font-medium text-red-500 mt-1 ${className || ''}`}
      {...props}
    >
      {children}
    </p>
  );
}
