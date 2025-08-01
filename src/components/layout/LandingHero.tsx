
import React from 'react';
import logo from '../../assets/react.svg';

/**
 * LandingHero: Professional, mobile-first hero section for the Enneagram Discovery App.
 * - Modern, calming color palette
 * - Responsive, touch-friendly
 * - App branding and intro
 */
export const LandingHero: React.FC = () => (
  <section className="landing-hero">
    <img src={logo} alt="Enneagram Discovery Logo" className="hero-logo" />
    <h1 className="hero-title">Enneagram Discovery</h1>
    <p className="hero-subtitle">
      Discover your Enneagram type. <br />
      Take our science-backed, step-by-step survey and unlock deep insights about your personality.
    </p>
  </section>
);
