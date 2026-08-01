import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = () => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(-1)} 
      className="global-back-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        color: '#6b7280',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        padding: '0',
        marginBottom: '20px',
        transition: 'color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.color = '#0d1117'}
      onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
    >
      <FiArrowLeft size={18} /> Back
    </button>
  );
};

export default BackButton;
