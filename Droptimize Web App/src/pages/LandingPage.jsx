import { useState } from "react";
import LandingPageHeader from "../components/LandingPageHeader.jsx";
import Footer from "../components/Footer.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

export default function LandingPage() {
  const [activeGroup, setActiveGroup] = useState(null); // 'admin' | 'courier' | null

  const showGroup = (group) => {
    setActiveGroup(group);
  };

  const goBack = () => {
    setActiveGroup(null);
  };

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

            {/* Shows the features of each group */}
            {activeGroup === null && (
              <>
                <div onClick={() => showGroup("admin")} style={{ cursor: "pointer" }}>
                  <FeatureCard
                    className="toggle-landing-feature-list"
                    title="For Admins"
                    description="Manage your dropshipping business with ease."
                    icon="/admin-icon.png"
                  />
                </div>

                <div onClick={() => showGroup("courier")} style={{ cursor: "pointer" }}>
                  <FeatureCard
                    className="toggle-landing-feature-list"
                    title="For Couriers"
                    description="Track your couriers' locations in real-time."
                    icon="/courier-icon.png"
                  />
                </div>
              </>
            )}

            {/* Admin feature list */}
            {activeGroup === "admin" && (
              <>
                <div className="back-button-wrapper">
                  <button className="back-button" onClick={goBack}>
                    ← Back
                  </button>
                </div>

                <div className="landing-admin-features">

                  <FeatureCard
                    className="landing-feature-card"
                    title="Driver Management"
                    description="Efficiently manage your drivers and their routes."
                    icon="/admin_features/driver-management.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Workload Estimation"
                    description="Estimate the workload for upcoming deliveries."
                    icon="/admin_features/workload-estimation.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Courier Location Tracking"
                    description="Gain insights into your couriers' locations and optimize delivery routes."
                    icon="/admin_features/courier-location-tracking.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Overspeeding Logging"
                    description="Monitor your drivers' speeds and ensure compliance."
                    icon="/admin_features/overspeeding-logging.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Driver Warning"
                    description="Access detailed driver behavior data and receive alerts for potential issues."
                    icon="/admin_features/driver-warning.png"
                  />
                </div>
              </>
            )}

            {/* Courier feature list */}
            {activeGroup === "courier" && (
              <>
                <div className="back-button-wrapper">
                  <button className="back-button" onClick={goBack}>
                    ← Back
                  </button>
                </div>

                <div className="landing-courier-features">
                  <FeatureCard
                    className="landing-feature-card"
                    title="Delivery Task List"
                    description="Know your current delivery location with precision."
                    icon="/courier_features/delivery-task-list.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Route Optimization"
                    description="Follow the most efficient route suggestions."
                    icon="/courier_features/route-optimization.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Speed Monitoring"
                    description="Monitor your speed and ensure compliance."
                    icon="/courier_features/speed-monitoring.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Speed Limit Alerts"
                    description="Receive alerts when speed limits are exceeded."
                    icon="/courier_features/speed-limit-alerts.png"
                  />

                  <FeatureCard
                    className="landing-feature-card"
                    title="Driving History"
                    description="Access your driving history for reference."
                    icon="/courier_features/driving-history.png"
                  />
                </div>
              </>
            )}

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
}
