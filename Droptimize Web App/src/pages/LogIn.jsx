import { TextField, Button, Checkbox } from '@mui/material';
import '../styles.css';

export default function LogInForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // handle login logic here
  };

  // Set document title
  document.title = "Droptimize - Log In";

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <img src="/logo.svg" alt="Droptimize Logo" className="login-logo" />

        <h2 className="login-form-title">
          Log In
        </h2>

        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
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
              sx={{ p: 0, mr: 1 }}
              id="rememberMe"
            />
            <label htmlFor="rememberMe" style={{ fontSize: 14 }}>Remember me</label>
          </div>
          <a href="/forgot-password" style={{ fontSize: 14 }}>Forgot Password?</a>
        </div>

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
            fontSize: '20px'
          }}
        >
          Log In
        </Button>

        <p>
          Don't have an account?{' '}<br />
          <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
};
