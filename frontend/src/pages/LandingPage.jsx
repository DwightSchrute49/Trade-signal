import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import "./LandingPage.css";

export default function LandingPage() {
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const featureRef = useRef(null);
  const scannerRef = useRef(null);
  const finalCtaRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    );
    gsap.fromTo(
      ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 },
    );
    gsap.fromTo(
      featureRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.4 },
    );
    gsap.fromTo(
      scannerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.6 },
    );
    gsap.fromTo(
      finalCtaRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.8 },
    );
    gsap.fromTo(
      footerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 1 },
    );
  }, []);

  return (
    <div className="landing-page">
      {/* Section 1 — Hero */}
      <section className="landing-hero">
        <div ref={heroRef} className="hero-content">
          <div className="hero-logo-wrap">
            <img src="/logo.jpg" alt="TradePulse" className="hero-logo" />
          </div>
          <h1 className="hero-title">
            Find the Best Trading Opportunities in Seconds
          </h1>
          <p className="hero-subtitle">
            AI-powered scanning for NIFTY 50 stocks. Detect reversal alerts,
            bullish trends, and live BUY/SELL signals — all in one intelligent
            dashboard.
          </p>
        </div>

        <div ref={ctaRef} className="hero-ctas">
          <Link to="/login" className="btn-landing btn-primary">
            Sign In
          </Link>
          <Link to="/signup" className="btn-landing btn-secondary">
            Create Account
          </Link>
        </div>
      </section>

      {/* Section 2 — Feature Highlights */}
      <section ref={featureRef} className="feature-section">
        <h2 className="feature-section-title">
          Powerful Tools for Smarter Trading
        </h2>
        <div className="feature-cards">
          <div className="feature-card">
            <span className="feature-icon">R</span>
            <h3 className="feature-card-title">Reversal Alerts</h3>
            <p className="feature-card-desc">
              Detect oversold stocks that may bounce.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">B</span>
            <h3 className="feature-card-title">Best Buy Opportunities</h3>
            <p className="feature-card-desc">
              Find strong bullish setups instantly.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">M</span>
            <h3 className="feature-card-title">Market Screener</h3>
            <p className="feature-card-desc">
              Scan the entire NIFTY50 and classify BUY / SELL / HOLD signals.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Live Scanner Preview */}
      <section ref={scannerRef} className="scanner-preview">
        <h2 className="scanner-preview-title">Live Market Scanner</h2>
        <div className="scanner-preview-card">
          <div className="scanner-row">
            <span className="scanner-symbol">RELIANCE</span>
            <span className="scanner-signal buy">BUY</span>
          </div>
          <div className="scanner-row">
            <span className="scanner-symbol">INFY</span>
            <span className="scanner-signal hold">HOLD</span>
          </div>
          <div className="scanner-row">
            <span className="scanner-symbol">TCS</span>
            <span className="scanner-signal sell">SELL</span>
          </div>
        </div>
      </section>

      {/* Section 4 — Call to Action */}
      <section ref={finalCtaRef} className="cta-section">
        <h2 className="cta-section-title">
          Start Finding Trading Opportunities Today
        </h2>
        <Link to="/signup" className="btn-landing btn-primary btn-cta-large">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.jpg" alt="" className="footer-logo" />
            <span className="footer-name">TradePulse</span>
          </div>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} TradePulse. NSE Live signals.
          </div>
        </div>
      </footer>
    </div>
  );
}
