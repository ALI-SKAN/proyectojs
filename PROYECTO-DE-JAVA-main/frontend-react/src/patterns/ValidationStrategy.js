// Strategy Pattern para Validación de Formularios
export class ValidationStrategy {
  constructor(strategy) {
    this.strategy = strategy;
  }
  validate(value) {
    return this.strategy(value);
  }
}

export const requiredStrategy = new ValidationStrategy((value) => {
  if (!value || value.toString().trim() === '') {
    return 'Este campo es requerido.';
  }
  return null;
});

export const emailStrategy = new ValidationStrategy((value) => {
  if (value && !/^\S+@\S+\.\S+$/.test(value)) {
    return 'El correo no es válido.';
  }
  return null;
});

export const minLengthStrategy = (min) => new ValidationStrategy((value) => {
  if (value && value.toString().trim().length < min) {
    return `Debe tener al menos ${min} caracteres.`;
  }
  return null;
});

export const dniStrategy = new ValidationStrategy((value) => {
  if (value && !/^\d{8}$/.test(value)) {
    return 'El DNI debe tener exactamente 8 dígitos numéricos.';
  }
  return null;
});

export const phoneStrategy = new ValidationStrategy((value) => {
  if (value && !/^\+51 \d{9}$/.test(value)) {
    return 'El celular debe tener exactamente 9 dígitos numéricos después del +51.';
  }
  return null;
});

export const fullNameStrategy = new ValidationStrategy((value) => {
  if (!value) return null;
  const words = value.trim().split(/\s+/);
  if (words.length < 3) {
    return 'Debe incluir al menos un nombre y dos apellidos.';
  }
  const isCapitalized = words.every(word => /^[A-ZÁÉÍÓÚÑ]/.test(word));
  if (!isCapitalized) {
    return 'Cada nombre y apellido debe empezar con letra mayúscula.';
  }
  return null;
});
