import { useState, useCallback } from 'react';

export interface ValidationRules {
  [key: string]: {
    required?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    custom?: (value: any) => string | undefined;
  };
}

export interface FormState {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export function useFormValidation<T extends FormState>(
  initialValues: T,
  validationRules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar un campo individual
  const validateField = useCallback(
    (name: string, value: any): string => {
      const rules = validationRules[name];
      if (!rules) return '';

      // Required
      if (rules.required) {
        const isEmpty = value === '' || value === null || value === undefined;
        if (isEmpty) {
          return typeof rules.required === 'string'
            ? rules.required
            : 'Este campo es requerido';
        }
      }

      // Si está vacío y no es required, no validar el resto
      if (!value && value !== 0) return '';

      // Min length
      if (rules.minLength && value.length < rules.minLength.value) {
        return rules.minLength.message;
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength.value) {
        return rules.maxLength.message;
      }

      // Pattern
      if (rules.pattern && !rules.pattern.value.test(value)) {
        return rules.pattern.message;
      }

      // Min
      if (rules.min !== undefined && Number(value) < rules.min.value) {
        return rules.min.message;
      }

      // Max
      if (rules.max !== undefined && Number(value) > rules.max.value) {
        return rules.max.message;
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
      }

      return '';
    },
    [validationRules]
  );

  // Validar todo el formulario
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // Manejar cambio de valor
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const finalValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({ ...prev, [name]: finalValue }));

      // Validar si el campo ya fue tocado
      if (touched[name]) {
        const error = validateField(name, finalValue);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  // Manejar blur (campo tocado)
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  // Manejar submit
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Marcar todos como tocados
      const allTouched: TouchedFields = {};
      Object.keys(validationRules).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validar
      const isValid = validateAll();

      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setIsSubmitting(false);
    },
    [values, validationRules, validateAll]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set valores manualmente
  const setFieldValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Set error manual
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
    validateAll,
  };
}
