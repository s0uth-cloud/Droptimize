import LandingPageHeader from "../components/LandingPageHeader.jsx";
import Footer from "../components/Footer.jsx";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <LandingPageHeader />

      <main className="landing-main">
        <section className="landing-welcome">
          <div className="landing-welcome-content">
            <h1 className="landing-title">Welcome to</h1>
            <img src="/logo.svg" alt="Droptimize Logo" className="landing-main-logo" />
            <p className="landing-description">
              Optimize your dropshipping business with our powerful tools and insights.
            </p>
            <a href="/signup" className="landing-cta-button">Get Started</a>
          </div>
          <div className="landing-hero">
            <img src="/hero-image.png" alt="Hero" className="landing-hero-image" />
          </div>
        </section>

        <section className="landing-features" id="features">
          <h2 className="landing-section-title">Features</h2>
          <div className="landing-feature-list">
            <div className="landing-feature-item">
              <h3>Product Research</h3>
              <p>Find winning products with our advanced research tools.</p>
            </div>
            <div className="landing-feature-item">
              <h3>Market Analysis</h3>
              <p>Analyze market trends to stay ahead of the competition.</p>
            </div>
            <div className="landing-feature-item">
              <h3>Performance Tracking</h3>
              <p>Track your store's performance with detailed analytics.</p>
            </div>
          </div>
        </section>

        <section className="landing-about" id="about">
          <h2 className="landing-section-title">About Us</h2>
          <p className="landing-about-description">
            Droptimize is dedicated to helping dropshippers succeed with advanced tools for product research, market analysis, and performance tracking.
          </p>
        </section>

        <section className="landing-contact" id="contact">
          <h2 className="landing-section-title">Contact Us</h2>
          <p className="landing-contact-description">
            Have questions or need support? <a href="/contact" className="landing-contact-link">Get in touch with us!</a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
