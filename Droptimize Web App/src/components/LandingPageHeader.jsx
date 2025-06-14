export default function LandingPageHeader() {
  return (
    <header className="landing-header">
      <a href="/">
        <img src="/logo.svg" alt="Droptimize Logo" className="landing-logo" />
      </a>

      <nav className="landing-nav">
        <a href="/" className="landing-nav-link">Home</a>
        <a href="#features" className="landing-nav-link">Features</a>
        <a href="#about" className="landing-nav-link">About</a>
        <a href="#contact" className="landing-nav-link">Contact</a>
      </nav>

      <div className="landing-auth-buttons">
        <a href="/login" className="landing-login-button">Login</a>
        <a href="/signup" className="landing-signup-button">Sign Up</a>
      </div>
    </header>
  );
};
