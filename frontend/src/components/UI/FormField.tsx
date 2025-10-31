import React from 'react';
import './FormField.css';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'date' | 'select' | 'textarea';
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  helperText?: string;
  icon?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  options = [],
  rows = 3,
  min,
  max,
  step,
  autoComplete,
  helperText,
  icon,
}) => {
  const hasError = touched && error;
  const fieldId = `field-${name}`;

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange,
      onBlur,
      disabled,
      required,
      className: `form-field-input ${hasError ? 'error' : ''} ${icon ? 'with-icon' : ''}`,
      placeholder,
      autoComplete,
      'aria-invalid': hasError ? true : false,
      'aria-describedby': hasError ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined,
    };

    switch (type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Seleccionar...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className={`form-field ${hasError ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
      <label htmlFor={fieldId} className="form-field-label">
        {icon && <span className="material-icons field-icon">{icon}</span>}
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      
      <div className="form-field-input-wrapper">
        {icon && type !== 'select' && type !== 'textarea' && (
          <span className="material-icons input-icon">{icon}</span>
        )}
        {renderInput()}
      </div>

      {helperText && !hasError && (
        <span id={`${fieldId}-helper`} className="form-field-helper">
          {helperText}
        </span>
      )}

      {hasError && (
        <span id={`${fieldId}-error`} className="form-field-error" role="alert">
          <span className="material-icons">error</span>
          {error}
        </span>
      )}
    </div>
  );
};
