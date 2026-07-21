import React from 'react';

// Factory Pattern para crear inputs dinámicamente
export const InputFactory = ({ type, name, label, value, onChange, placeholder, required, options, maxLength, children, error, prefix, suffix }) => {
  const commonProps = {
    name,
    value,
    onChange,
    required,
    placeholder,
  };

  let inputElement = null;

  switch (type) {
    case 'text':
    case 'email':
    case 'tel':
      inputElement = (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {prefix && <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{prefix}</span>}
          <input type={type} {...commonProps} style={{ ...(prefix ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}), ...(suffix ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}), flex: 1, width: '100%' }} />
          {suffix && <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 8px 8px 0', color: 'var(--text-muted)', fontWeight: 'bold' }}>{suffix}</span>}
        </div>
      );
      break;
    case 'textarea':
      inputElement = <textarea {...commonProps} maxLength={maxLength} style={{ minHeight: '100px' }} />;
      break;
    case 'select':
      inputElement = (
        <select {...commonProps}>
          {options && options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
      break;
    default:
      inputElement = <input type="text" {...commonProps} />;
  }

  return (
    <div className={`field ${type === 'textarea' || type === 'select' ? 'field-full' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {children}
      </div>
      {inputElement}
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};
