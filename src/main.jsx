import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { AuthProvider } from "./context/AuthContext";
import { BudgetProvider } from "./context/BudgetContext";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BudgetProvider>
        <AuthProvider>
        <Elements stripe={stripePromise}>
          <App />
        </Elements>
        </AuthProvider>
      </BudgetProvider>
    </BrowserRouter>
  </StrictMode>,
);
