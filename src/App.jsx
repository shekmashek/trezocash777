import React from 'react';
import { DataProvider } from './context/DataContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import AppContent from './AppContent.jsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <DataProvider>
      <UIProvider>
        <Elements stripe={stripePromise}>
          <AppContent />
        </Elements>
      </UIProvider>
    </DataProvider>
  );
}

export default App;
