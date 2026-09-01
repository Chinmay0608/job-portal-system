import React from 'react';
import Select from 'react-select';

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#fff',
    borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
    },
    borderRadius: '0.5rem',
    minHeight: '42px',
    cursor: 'pointer',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#2563eb' 
      : state.isFocused 
        ? '#eff6ff' 
        : 'transparent',
    color: state.isSelected ? '#fff' : '#1f2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#2563eb',
      color: '#fff',
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    zIndex: 50,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1f2937',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

const CustomSelect = ({ options, value, onChange, placeholder, className, isSearchable = false, isDisabled = false, name }) => {
  // Find the full option object that matches the value string/number
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <Select
      className={className}
      styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange({ target: { name, value: selected.value } })}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      name={name}
    />
  );
};

export default CustomSelect;
