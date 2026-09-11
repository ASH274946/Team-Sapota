import React, { SelectHTMLAttributes } from 'react';
import { SelectDropdown } from './select-dropdown';

interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const NativeSelect = React.forwardRef<HTMLDivElement, NativeSelectProps>(
  ({ value, onChange, onValueChange, children, className, label, disabled }, ref) => {
    const stringValue = value !== undefined && value !== null ? String(value) : undefined;

    const handleChange = (e: { target: { value: string } }) => {
      onValueChange?.(e.target.value);
      if (onChange) {
        const syntheticEvent = {
          target: { value: e.target.value },
          currentTarget: { value: e.target.value }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <SelectDropdown
        ref={ref}
        value={stringValue}
        onChange={handleChange}
        onValueChange={onValueChange}
        disabled={disabled}
        label={label}
        className={className}
      >
        {children}
      </SelectDropdown>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';
