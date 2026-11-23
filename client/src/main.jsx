import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/vetcare-ui.css';
import { AuthProvider } from './context/AuthContext';
import VetCarePortal from './components/VetCarePortal';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <VetCarePortal />
    </AuthProvider>
  </StrictMode>
);
