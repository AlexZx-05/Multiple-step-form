import React from 'react';
import { createRoot } from 'react-dom/client';

// Paste your multi-step form React component here or import it
import MultiStepForm from './MultiStepForm';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<MultiStepForm />);
