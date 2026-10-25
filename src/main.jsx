import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './components/scenes/png-adjustments.css';
import './animations/hero-intro.css';
import './animations/scheme-intro.css';
import './animations/message-intros.css';
import './animations/crack-intro.css';
import './animations/service-button-hover.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
