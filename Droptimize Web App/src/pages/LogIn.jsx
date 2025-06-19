import { TextField, Button, Checkbox } from '@mui/material';
import '../styles.css';
import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig.js';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function LogInForm() {
  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Droptimize - Log In";
  }, []);

  // State for form data
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State for form errors and loading state
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart()
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Trim whitespace from email and password
    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim()
    };
    setFormData(trimmedData);

    // Basic validation
    const newErrors = {};
    if (!trimmedData.email) newErrors.email = "Email is required";
    if (!trimmedData.password) newErrors.password = "Password is required";

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    setError('');
    setLoading(true);

    // Set persistence based on "Remember Me"
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    setPersistence(auth, persistenceType)
      .then(() =>
        // Sign in with email and password
        signInWithEmailAndPassword(auth, trimmedData.email, trimmedData.password)
      )
      .then((userCredential) => {
        console.log('User logged in:', userCredential.user);
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('Login error:', error.code, error.message);
        const code = error.code;
        if (code === 'auth/user-not-found') {
          setFieldErrors({ email: 'No account found with this email' });
        } else if (code === 'auth/wrong-password') {
          setFieldErrors({ password: 'Incorrect password' });
        } else if (code === 'auth/invalid-email') {
          setFieldErrors({ email: 'Invalid email format' });
        } else {
          setError('Login failed. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleForgotPassword = () => {
    const email = formData.email.trim();
    if (!email) {
      setFieldErrors({ email: 'Enter your email to reset password' });
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert('Password reset email sent! Please check your inbox.');
      })
      .catch((error) => {
        console.error('Password reset error:', error.code, error.message);
        if (error.code === 'auth/user-not-found') {
          setFieldErrors({ email: 'No account associated with this email' });
        } else {
          setError('Failed to send password reset email.');
        }
      });
  };

  return (
    <div className="login-form-container">
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <img src="/logo.svg" alt="Droptimize Logo" className="max-w-[400px]" />

        <h2 className="login-form-title">Log In</h2>

        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
          value={formData.email}
          onChange={handleChange}
          name="email"
          error={!!fieldErrors.email}
          helperText={fieldErrors.email || ''}
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
          value={formData.password}
          onChange={handleChange}
          name="password"
          error={!!fieldErrors.password}
          helperText={fieldErrors.password || ''}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '300px',
          margin: '8px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              color="primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              sx={{ p: 0, mr: 1 }}
              id="rememberMe"
            />
            <label htmlFor="rememberMe" style={{ fontSize: 14 }}>Remember me</label>
          </div>
          <button
            className='forgot-password-link'
            type="button"
            onClick={handleForgotPassword}
            style={{
              fontSize: 14,
              textDecoration: 'underline',
               background: 'none',
               border: 'none',
               color: '#00b2e1',
               cursor: 'pointer',
               fontWeight: 600
            }}
          >
            Forgot Password?
          </button>
        </div>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{
            width: '200px',
            height: '50px',
            justifySelf: 'center',
            borderRadius: '10px',
            backgroundImage: 'linear-gradient(#00b2e1, #0064b5)',
            fontFamily: 'LEMON MILK',
            fontSize: loading ? '16px' : '20px'
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>

        <p>
          Don't have an account?{' '}<br />
          <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
}
