import LandingPageHeader from "../components/LandingPageHeader.jsx";
import Footer from "../components/Footer.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

export default function LandingPage() {
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
            <FeatureCard className="landing-feature-card"
              title="For Admins"
              description="Manage your dropshipping business with ease."
              icon="/admin-icon.png"
            />

            <div className="admin-features">
              <FeatureCard className="landing-feature-card"
                title="Driver Management"
                description="Efficiently manage your drivers and their routes."
                icon="/driver-icon.png"
              />

              <FeatureCard className="landing-feature-card"
                title="Workload Estimation"
                description="Estimate the workload for upcoming deliveries."
                icon="/workload-estimation-icon.png"
              />

              <FeatureCard className="landing-feature-card"
                title="Courier Location Tracking"
                description="Gain insights into your couriers' locations and optimize delivery routes."
                icon="/courier-location-tracking-icon.png"
              />

              <FeatureCard className="landing-feature-card"
                title="Overspeeding Logging"
                description="Monitor your business performance with detailed analytics."
                icon="/analytics-icon.png"
              />
            </div>

            <FeatureCard className="landing-feature-card"
              title="For Couriers"
              description="Track your couriers' locations in real-time."
              icon="/courier-icon.png"
            />
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
