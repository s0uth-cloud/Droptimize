import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

const maybeRedirectResetPasswordToApp = () => {
  const { pathname, search } = window.location;
  if (pathname !== '/reset-password') return;

  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (mode !== 'resetPassword' || !oobCode) return;

  const deepLink = `droptimize://ResetPassword?oobCode=${encodeURIComponent(oobCode)}`;
  window.location.replace(deepLink);
};

maybeRedirectResetPasswordToApp();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
