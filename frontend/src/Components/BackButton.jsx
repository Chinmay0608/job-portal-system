import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = ({ fallbackUrl }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (fallbackUrl) {
      navigate(fallbackUrl);
    } else {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const target = user?.role === 'recruiter' ? '/recruiter-dashboard' : '/candidate-dashboard';
        navigate(target);
      } catch {
        navigate('/');
      }
    }
  };

  return (
    <button 
      type="button"
      onClick={handleBack} 
      className="global-back-btn"
      aria-label="Go back"
    >
      <FiArrowLeft size={18} />
      <span>Back</span>
    </button>
  );
};

export default BackButton;
