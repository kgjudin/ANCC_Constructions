import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Plus } from 'lucide-react';

export interface CreatableSelectOption {
  label: string;
  value: string;
}

export interface CreatableSelectProps {
  label?: string;
  error?: string;
  options: CreatableSelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  required?: boolean;
}

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  className,
  id,
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Sync input value with selected value when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      const selectedOption = options.find((opt) => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : value);
    }
  }, [value, options, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = options.find(opt => opt.label.toLowerCase() === inputValue.trim().toLowerCase());
  const showAddOption = inputValue.trim() !== '' && !exactMatch;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleAdd = () => {
    const newVal = inputValue.trim();
    if (newVal) {
      onChange(newVal);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full space-y-1 relative" ref={wrapperRef}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={selectId}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={clsx(
            'w-full rounded-xl border bg-white px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 border-slate-300 pr-10',
            error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : 'focus:border-brand-500',
            className
          )}
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            !showAddOption && <div className="px-4 py-2 text-sm text-slate-500">No options found</div>
          )}
          
          {showAddOption && (
            <div
              className="px-4 py-2.5 text-sm text-brand-600 font-semibold hover:bg-brand-50 cursor-pointer flex items-center border-t border-slate-100"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add "{inputValue}"
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
