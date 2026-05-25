"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import changelogData from "@/data/changelog.json";
import {
  Background,
  Navbar,
  Hero,
  DashboardPreview,
  BentoFeatures,
  Metrics,
  CTA,
  Footer,
  ChangelogModal,
} from "@/components/Landing";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    document.documentElement.classList.add("force-dark");
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.classList.remove("force-dark");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      {/* Dynamic Grid Background */}
      <Background />

      {/* Luxury Sticky Navigation */}
      <Navbar
        isAuthenticated={isAuthenticated}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsChangelogOpen={setIsChangelogOpen}
      />

      {/* High Impact Hero Header */}
      <Hero
        isAuthenticated={isAuthenticated}
        version={changelogData.version}
        build={changelogData.build}
      />

      {/* High-Fidelity Command Center Mockup */}
      <DashboardPreview />

      {/* Interactive Infrastructure Grid */}
      <BentoFeatures />

      {/* Forensic Audit Telemetry */}
      <Metrics />

      {/* Global Deploy Banner */}
      <CTA isAuthenticated={isAuthenticated} />

      {/* Unified Brand Footer */}
      <Footer />

      {/* Interactive Changelog System Ledger */}
      <ChangelogModal
        open={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );
}
