import { TextField, Button } from '@mui/material';
import '../styles.css';
import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig.js'; // Adjust the import path as necessary
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate } from 'react-router-dom';


export default function RegistrationForm() {
  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Create An Account";
  }, []);

  // State for form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // State for form errors and success message
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value // Trim whitespace from input values
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Before validation (in handleSubmit)
    const trimmedData = Object.fromEntries(
      Object.entries(formData).map(([key, val]) => [key, val.trim()])
    );
    setFormData(trimmedData);

    const { email, password } = trimmedData;


    // Basic validation
    const newErrors = {};
    if (!trimmedData.firstName) newErrors.firstName = "First name is required";
    if (!trimmedData.lastName) newErrors.lastName = "Last name is required";
    if (!trimmedData.email) newErrors.email = "Email is required";
    if (!trimmedData.password) newErrors.password = "Password is required";
    if (!trimmedData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    if (trimmedData.password && trimmedData.confirmPassword && trimmedData.password !== trimmedData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    // Check if email is valid
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedData.email && !emailPattern.test(trimmedData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    // Reset errors and loading state
    setFieldErrors({});
    setError('');
    setLoading(true);

    // Create user with email and password
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User registered:', user);
        setSuccess(true);

        // Send email verification
        sendEmailVerification(user);

        // Delay redirection to login page
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch((error) => {
        // Handle errors
        const errorMessage = error.message;
        console.error('Error registering user:', error.code, errorMessage);

        if (error.code === 'auth/email-already-in-use') {
          setFieldErrors({ email: 'This email is already registered' });
        } else {
          setError(errorMessage);
        }
      })
      .finally(() => setLoading(false));
  };


  return (
    <div className="signup-form-container">
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Registration successful! Please check your email for verification.</p>}
      <form onSubmit={handleSubmit} className="signup-form">
        <img src="/logo.svg" alt="Droptimize Logo" className='max-w-[400px]' />

        <h2 className="sign-up-form-title">
          Create An Account
        </h2>

        <TextField
          label="First Name"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
          value={formData.firstName}
          onChange={handleChange}
          name="firstName"
          error={!!fieldErrors.firstName}
          helperText={fieldErrors.firstName || ''}
          disabled={loading}
        />

        <TextField
          label="Last Name"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
          value={formData.lastName}
          onChange={handleChange}
          name="lastName"
          error={!!fieldErrors.lastName}
          helperText={fieldErrors.lastName || ''}
          disabled={loading}
        />

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
          disabled={loading}
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
          disabled={loading}
        />

        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
          value={formData.confirmPassword}
          onChange={handleChange}
          name="confirmPassword"
          error={!!fieldErrors.confirmPassword}
          helperText={fieldErrors.confirmPassword || ''}
          disabled={loading}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            width: '200px',
            height: '50px',
            justifySelf: 'center',
            borderRadius: '10px',
            backgroundImage: 'linear-gradient(#00b2e1, #0064b5)',
            fontFamily: 'LEMON MILK',
            fontSize: loading ? '16px' : '20px',
          }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
          {/* Show loading state if applicable */}
        </Button>

        <p>
          Already have an account?{' '}<br />
          <a href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
};
