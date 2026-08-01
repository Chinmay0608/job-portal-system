import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = () => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(-1)} 
      className="global-back-btn"
    >
      <FiArrowLeft size={18} /> Back
    </button>
  );
};

export default BackButton;
