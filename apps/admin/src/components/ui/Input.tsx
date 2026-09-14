import React, { InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className,
  id,
  onFocus,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={currentType}
          onFocus={(e) => {
            if (currentType === 'number' && (e.target.value === '0' || e.target.value === '0.00')) {
              e.target.select();
            }
            if (onFocus) onFocus(e);
          }}
          className={clsx(
            'w-full rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500',
            icon ? 'pl-10' : 'pl-3',
            isPassword ? 'pr-10' : 'pr-3',
            'py-2.5',
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-brand-500',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            tabIndex={-1}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
