import React from 'react';
import Select from 'react-select';

const getCustomStyles = (borderless) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: borderless ? 'transparent' : '#fff',
    borderColor: borderless 
      ? 'transparent' 
      : state.isFocused ? '#2563eb' : '#e5e7eb',
    boxShadow: borderless 
      ? 'none' 
      : state.isFocused ? '0 0 0 1px #2563eb' : 'none',
    '&:hover': {
      borderColor: borderless 
        ? 'transparent' 
        : state.isFocused ? '#2563eb' : '#d1d5db',
    },
    borderRadius: '0.5rem',
    minHeight: borderless ? '38px' : '42px',
    cursor: 'pointer',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#2563eb' 
      : state.isFocused 
        ? '#eff6ff' 
        : '#ffffff',
    color: state.isSelected ? '#fff' : '#1f2937',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: '0.9rem',
    '&:active': {
      backgroundColor: '#2563eb',
      color: '#fff',
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 99999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 99999,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1f2937',
    fontWeight: 500,
    fontSize: '0.92rem',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#6b7280',
    fontSize: '0.92rem',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    padding: '4px',
    '&:hover': {
      color: '#4b5563',
    },
  }),
});

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className, 
  isSearchable = false, 
  isDisabled = false, 
  name,
  borderless = false
}) => {
  const selectedOption = options?.find(opt => opt.value === value) || null;

  return (
    <Select
      className={className}
      styles={getCustomStyles(borderless)}
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange({ target: { name, value: selected ? selected.value : "" } })}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      name={name}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
    />
  );
};

export default CustomSelect;
