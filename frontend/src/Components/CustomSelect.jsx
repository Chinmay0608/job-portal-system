import React from 'react';
import Select from 'react-select';

const getCustomStyles = (borderless) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: borderless ? 'transparent' : '#ffffff',
    borderColor: borderless 
      ? 'transparent' 
      : state.isFocused ? '#2563eb' : '#e5e7eb',
    boxShadow: borderless 
      ? 'none' 
      : state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.15)' : 'none',
    '&:hover': {
      borderColor: borderless 
        ? 'transparent' 
        : state.isFocused ? '#2563eb' : '#d1d5db',
    },
    borderRadius: borderless ? '999px' : '0.625rem',
    minHeight: '42px',
    cursor: 'pointer',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: borderless ? '0 4px' : '0 10px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#2563eb' 
      : state.isFocused 
        ? '#eff6ff' 
        : '#ffffff',
    color: state.isSelected 
      ? '#ffffff' 
      : state.isFocused 
        ? '#2563eb' 
        : '#1f2937',
    cursor: 'pointer',
    padding: '9px 14px',
    margin: '2px 0',
    borderRadius: '8px',
    fontSize: '0.92rem',
    fontWeight: state.isSelected ? '600' : '500',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:active': {
      backgroundColor: '#2563eb',
      color: '#ffffff',
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 16px 44px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
    padding: '6px',
    overflow: 'hidden',
    marginTop: '6px',
    zIndex: 99999,
    animation: 'dropdownRollDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    transformOrigin: 'top center',
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '0',
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 99999,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1f2937',
    fontWeight: 500,
    fontSize: '0.93rem',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#6b7280',
    fontSize: '0.93rem',
    fontWeight: 400,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#2563eb' : '#9ca3af',
    padding: '4px 6px',
    transition: 'color 0.4s ease, transform 0.4s ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    '&:hover': {
      color: '#2563eb',
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
