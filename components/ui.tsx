
import React, { ReactNode } from 'react';

interface CardProps {
  // FIX: Made children optional to handle JSX implicit children typing issues.
  children?: ReactNode;
  className?: string;
}

// FIX: Changed to React.FC to correctly handle props like `key`.
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

// FIX: Changed to a type alias to correctly extend ButtonHTMLAttributes
export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, ...props }, ref) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={id}
      ref={ref}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      {...props}
    />
  </div>
));

// FIX: Changed to a type alias to correctly extend SelectHTMLAttributes
export type SelectProps = {
  label: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;


export const Select = ({ label, id, children, ...props }: SelectProps) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        id={id}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        {...props}
      >
        {children}
      </select>
    </div>
);


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // FIX: Made children optional to handle JSX implicit children typing issues.
  children?: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

// FIX: Made children optional to handle JSX implicit children typing issues.
export const PageTitle = ({ children, actions }: { children?: ReactNode, actions?: ReactNode }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold text-slate-800">{children}</h1>
    <div>{actions}</div>
  </div>
);

export const KpiCard = ({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-cyan-100 text-cyan-600">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'primary', children, className = '' }: BadgeProps) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table = ({ children, className = '' }: TableProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  </div>
);

Table.Head = ({ children }: { children: ReactNode }) => (
  <thead className="bg-gray-50">
    {children}
  </thead>
);

Table.Header = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

Table.Body = ({ children }: { children: ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-200">
    {children}
  </tbody>
);

Table.Row = ({ children, className = '', ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={className} {...props}>
    {children}
  </tr>
);

Table.Cell = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);

// Add Table namespace for better intellisense
declare module './ui' {
  interface Table extends React.FC<TableProps> {
    Head: React.FC<{ children: ReactNode }>;
    Header: React.FC<{ children: ReactNode; className?: string }>;
    Body: React.FC<{ children: ReactNode }>;
    Row: React.FC<{ children: ReactNode; className?: string }>;
    Cell: React.FC<{ children: ReactNode; className?: string }>;
  }
}