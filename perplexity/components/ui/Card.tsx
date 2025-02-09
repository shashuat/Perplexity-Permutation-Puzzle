// components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 mb-6 ${className}`}>
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      {children}
    </div>
  );
}