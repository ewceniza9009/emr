"use client";

import React from "react";
import Link from "next/link";
import { Menu, X, ShieldCheck, History, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  isAuthenticated: boolean;
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsChangelogOpen: (open: boolean) => void;
}

export default function Navbar({
  isAuthenticated,
  isScrolled,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setIsChangelogOpen,
}: NavbarProps) {
  const authLink = isAuthenticated ? "/dashboard" : "/login";
  const authLabelNavbar = isAuthenticated ? "Dashboard" : "Launch App";

  const navLinks = [
    { label: "Platform", id: "platform" },
    { label: "Architecture", id: "architecture" },
    { label: "Security", id: "security" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? "bg-[#020408]/80 backdrop-blur-2xl border-b border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-teal-500/20 to-transparent border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:shadow-[0_0_40px_rgba(20,184,166,0.3)] transition-all duration-500">
              <ShieldCheck className="w-6 h-6 text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none uppercase">
                HALKYONE
              </span>
              <span className="text-[9px] font-black text-teal-500 uppercase tracking-[0.3em] mt-1">
                Clinical OS
              </span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-10 p-2 px-6 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md">
            {navLinks.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors py-2 relative group"
              >
                {item.label}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-teal-500 group-hover:w-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <History className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />{" "}
              Changelog
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={authLink}
              className="hidden md:flex relative h-12 px-8 items-center justify-center rounded-xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
              <div className="absolute inset-px rounded-[11px] bg-gradient-to-b from-white/20 to-transparent opacity-50" />
              <span className="relative z-10 flex items-center text-[11px] font-black text-white uppercase tracking-[0.2em]">
                {authLabelNavbar}{" "}
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button
              className="md:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 pt-28 pb-8 px-6 bg-[#020408]/90 border-b border-white/10 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-8">
              {navLinks.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-bold uppercase tracking-[0.1em] text-white"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-white/5" />
              <button
                onClick={() => {
                  setIsChangelogOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-xl font-bold uppercase tracking-[0.1em] text-white flex items-center gap-3 text-left"
              >
                Changelog <History className="w-5 h-5 text-teal-500" />
              </button>
            </div>
            <Link
              href={authLink}
              className="h-16 w-full mt-auto bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(20,184,166,0.4)]"
            >
              {authLabelNavbar}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
