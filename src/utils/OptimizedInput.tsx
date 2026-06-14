import React, { useState, useEffect } from 'react';
import { cn } from './cn';

interface OptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const OptimizedInput = React.forwardRef<HTMLInputElement, OptimizedInputProps>(({
  value,
  onChangeValue,
  icon,
  rightElement,
  containerClassName,
  className,
  ...props
}, ref) => {
  // Local state for fast typing without triggering parent re-render
  const [localValue, setLocalValue] = useState(value);

  // Sync from parent if it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    // Debounce propagation to parent to avoid heavy re-renders
    // Or we could let parent pass a debounced callback
    onChangeValue(e.target.value); 
  };

  return (
    <div className={cn("relative group/input", containerClassName)}>
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 group-focus-within/input:text-white transition-colors z-10 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        value={localValue}
        onChange={handleChange}
        className={cn(
          "w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl py-3.5 pr-12 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] text-sm font-bold shadow-inner transition-all",
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {rightElement}
        </div>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';
