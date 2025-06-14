import { TextField, Button } from '@mui/material';
import '../styles.css';

export default function RegistrationForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // handle sign-up logic here
  };

  return (
    document.title = "Create An Account",

    <div className="signup-form-container">

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
        />

        <TextField
          label="Last Name"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
        />

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

        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ width: '300px' }}
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
            fontSize: '20px'
          }}
        >
          Register
        </Button>

        <p>
          Already have an account?{' '}<br />
          <a href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
};
