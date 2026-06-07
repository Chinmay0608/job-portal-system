import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import "bootstrap/dist/css/bootstrap.min.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,

        style: {
          borderRadius: "18px",
          background: "#07111f",
          color: "#fff",
          padding: "16px 20px",
        },

        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },

        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />

    <App />
  </>
  </StrictMode>,
)
