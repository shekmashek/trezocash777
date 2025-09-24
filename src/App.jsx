import React from 'react';
import { BudgetProvider } from './context/BudgetContext.jsx';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import AppContent from './AppContent.jsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <BudgetProvider>
      <Elements stripe={stripePromise}>
        <AppContent />
      </Elements>
    </BudgetProvider>
  );
}

export default App;
