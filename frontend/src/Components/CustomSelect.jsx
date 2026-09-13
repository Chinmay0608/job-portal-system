import React from 'react';
import Select from 'react-select';

const getCustomStyles = (borderless) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: borderless ? 'transparent' : '#ffffff',
    borderColor: borderless 
      ? 'transparent' 
      : state.isFocused ? '#3b82f6' : '#e2e8f0',
    boxShadow: borderless 
      ? 'none' 
      : state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
    '&:hover': {
      borderColor: borderless 
        ? 'transparent' 
        : state.isFocused ? '#3b82f6' : '#cbd5e1',
    },
    borderRadius: borderless ? '9999px' : '0.75rem',
    minHeight: '44px',
    cursor: 'pointer',
    transition: 'all 150ms ease-in-out',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: borderless ? '0 4px' : '0 12px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#3b82f6' 
      : state.isFocused 
        ? '#eef2ff' 
        : '#ffffff',
    color: state.isSelected 
      ? '#ffffff' 
      : state.isFocused 
        ? '#1d4ed8' 
        : '#0f172a',
    cursor: 'pointer',
    padding: '10px 14px',
    margin: '2px 0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: state.isSelected ? '600' : '500',
    transition: 'background-color 150ms ease, color 150ms ease',
    '&:active': {
      backgroundColor: '#1d4ed8',
      color: '#ffffff',
    },
  }),
  menu: (provided, state) => ({
    ...provided,
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 6px 12px -4px rgba(15, 23, 42, 0.08)',
    padding: '6px',
    overflow: 'hidden',
    marginTop: state?.placement === 'top' ? '0' : '6px',
    marginBottom: state?.placement === 'top' ? '6px' : '0',
    backgroundColor: '#ffffff',
    zIndex: 999999,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '0',
    maxHeight: '220px',
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 999999,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#0f172a',
    fontWeight: 500,
    fontSize: '0.875rem',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 400,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#3b82f6' : '#94a3b8',
    padding: '4px 8px',
    transition: 'color 150ms ease, transform 200ms ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    '&:hover': {
      color: '#3b82f6',
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
  borderless = false,
  "aria-label": ariaLabel,
  menuPlacement = "auto",
  maxMenuHeight = 220,
}) => {
  const selectedOption = options?.find(opt => opt.value === value) || null;

  return (
    <div className={`relative ${className || ''}`}>
      <Select
        aria-label={ariaLabel || placeholder}
        className="focus:ring-2 focus:ring-brand-500 rounded-xl"
        classNamePrefix="custom-select"
        styles={getCustomStyles(borderless)}
        options={options}
        value={selectedOption}
        onChange={(selected) => onChange({ target: { name, value: selected ? selected.value : "" } })}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        name={name}
        menuPlacement={menuPlacement}
        menuPosition="fixed"
        maxMenuHeight={maxMenuHeight}
        menuShouldScrollIntoView={true}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      />
    </div>
  );
};

export default CustomSelect;
