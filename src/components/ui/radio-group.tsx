import React from 'react';

interface RadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

export const RadioGroup = ({ 
  children, 
  value, 
  onValueChange, 
  defaultValue, 
  className = '' 
}: RadioGroupProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={`grid gap-2 ${className}`}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = ({ value, id, className = '' }: RadioGroupItemProps) => {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext);
  const isChecked = value === selectedValue;
  
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      className={`aspect-square h-4 w-4 rounded-full border border-gray-300 text-gray-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked ? 'bg-gray-900 border-gray-900' : 'bg-white'
      } ${className}`}
      id={id}
      onClick={() => onValueChange?.(value)}
    >
      {isChecked && (
        <div className="flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      )}
    </button>
  );
};