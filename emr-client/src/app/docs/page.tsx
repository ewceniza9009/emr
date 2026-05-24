"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Terminal,
  Cpu,
  Database,
  Lock,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Activity,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Background,
  Navbar,
  Footer,
  ChangelogModal,
} from "@/components/Landing";

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function DocsPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections: DocSection[] = [
    {
      id: "intro",
      category: "Getting Started",
      title: "Introduction",
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-lg text-slate-300 leading-relaxed">
            Halkyone Clinical OS is a high-performance, next-generation
            Electronic Medical Record (EMR) and clinical operations platform
            designed for speed, visual excellence, and extreme reliability in
            high-acuity environments.
          </p>
          <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 text-slate-300">
            <div className="flex gap-3">
              <Activity className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">
                  Architecture Philosophy
                </strong>
                Halkyone operates as an event-driven decoupled architecture. The
                frontend leverages modern React server components and
                client-side stores, while the backend relies on a strongly-typed
                .NET Core GraphQL and REST API backed by PostgreSQL.
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mt-8">Core Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/20 transition-all">
              <h4 className="font-bold text-white mb-1">
                ⚡ Sub-50ms Response
              </h4>
              <p className="text-xs text-slate-400">
                Optimized GraphQL endpoint query orchestration and Redis
                data-caching layers.
              </p>
            </li>
            <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/20 transition-all">
              <h4 className="font-bold text-white mb-1">
                📡 Real-time Telemetry
              </h4>
              <p className="text-xs text-slate-400">
                SignalR web-sockets for live clinician dispatch radar and
                patient-tracking status updates.
              </p>
            </li>
            <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/20 transition-all">
              <h4 className="font-bold text-white mb-1">
                💾 Offline-First Tolerant
              </h4>
              <p className="text-xs text-slate-400">
                Capacitor SQLite integration for charting in zero-connectivity
                rural and building environments.
              </p>
            </li>
            <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/20 transition-all">
              <h4 className="font-bold text-white mb-1">🔒 HIPAA Compliance</h4>
              <p className="text-xs text-slate-400">
                Complete audit trail logging, device trust validation, and
                strict Row-Level Security (RLS).
              </p>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "triage-nlp",
      category: "Core Engines",
      title: "NLP & Clinical Negation Parser",
      icon: <Terminal className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            Halkyone embeds a sophisticated NLP engine incorporating a
            **NegEx-inspired clinical negation parser** using compiled regular
            expressions to process emergency secure chat overrides.
          </p>
          <p className="text-slate-300">
            It scans incoming chat messages for patient warnings and
            automatically scales triage case acuity levels to{" "}
            <strong>Critical</strong> if key emergency descriptors are matched,
            unless they fall within negation scopes (e.g. &quot;no chest
            pain&quot; or &quot;denies dyspnea&quot;).
          </p>
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={() =>
                  copyToClipboard(
                    `public static class NegationParser
{
    private static readonly Regex NegationPattern = new Regex(
        @"(?:no|denies|denying|without|rule out|free of|negative for)\\s+([\\w\\s]{1,30})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );
}`,
                    "code-negex",
                  )
                }
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copiedId === "code-negex" ? (
                  <Check className="w-3 h-3 text-teal-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="p-5 rounded-xl bg-[#080c14] border border-white/5 overflow-x-auto text-xs text-teal-300 font-mono">
              {`// C# Negation Extraction Engine
public static class NegationParser
{
    private static readonly Regex NegationPattern = new Regex(
        @"(?:no|denies|denying|without|rule out|free of|negative for)\\s+([\\w\\s]{1,30})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    public static HashSet<string> GetNegatedSymptoms(string text)
    {
        var negated = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(text)) return negated;

        var matches = NegationPattern.Matches(text);
        foreach (Match match in matches)
        {
            if (match.Groups.Count > 1)
            {
                negated.Add(match.Groups[1].Value.Trim());
            }
        }
        return negated;
    }
}`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "smartphrases",
      category: "Core Engines",
      title: "SmartPhrase Narrative Overlays",
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            To accelerate clinical documentation, Halkyone supports
            **caret-tracking Smart Phrase popover overlays** that follow the
            typing cursor inside narrative and SOAP textareas when the user
            enters the `&quot;/&quot;` trigger shortcut.
          </p>
          <p className="text-slate-300">
            This utility enables immediate injection of macro templates and
            structured phrases. NoteEditor panels are structured to lock
            metadata and headers at the top, leaving textarea regions
            dynamically scrollable.
          </p>
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={() =>
                  copyToClipboard(
                    `const triggerSmartPhrase = (textarea, cursorIdx) => {
  const coordinates = getCaretCoordinates(textarea, cursorIdx);
  setPopover({
    visible: true,
    top: coordinates.top + textarea.offsetTop,
    left: coordinates.left + textarea.offsetLeft
  });
};`,
                    "code-smartphrase",
                  )
                }
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copiedId === "code-smartphrase" ? (
                  <Check className="w-3 h-3 text-teal-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="p-5 rounded-xl bg-[#080c14] border border-white/5 overflow-x-auto text-xs text-teal-300 font-mono">
              {`// Caret-Tracking Position Handler in React
const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
  const textarea = e.currentTarget;
  const value = textarea.value;
  const selectionStart = textarea.selectionStart;
  
  const lastChar = value.substring(selectionStart - 1, selectionStart);
  if (lastChar === "/") {
    const coords = getCaretCoordinates(textarea, selectionStart);
    setSmartPhraseState({
      isOpen: true,
      x: coords.left + textarea.getBoundingClientRect().left,
      y: coords.top + textarea.getBoundingClientRect().top + window.scrollY + 20
    });
  } else {
    setSmartPhraseState({ isOpen: false, x: 0, y: 0 });
  }
};`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "architecture",
      category: "Logistics & Operations",
      title: "Logistics & Routing Engine",
      icon: <Cpu className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            Halkyone embeds an advanced logistics engine utilizing **OSRM (Open
            Source Routing Machine)** to dynamically calculate physical drive
            times, distances, and safety buffers between clinician house calls.
          </p>
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={() =>
                  copyToClipboard(
                    `public async Task<(double distanceInMiles, double durationInMinutes)> GetDistanceAndDurationAsync(
    double startLat, double startLon, double endLat, double endLon, CancellationToken ct = default
) {
    if (!_enableOsrmCached.Value) {
        return (fallbackDistance, fallbackDuration); // Haversine estimate
    }
    // Query OSRM client route/v1/driving/...
}`,
                    "code-osrm",
                  )
                }
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copiedId === "code-osrm" ? (
                  <Check className="w-3 h-3 text-teal-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="p-5 rounded-xl bg-[#080c14] border border-white/5 overflow-x-auto text-xs text-teal-300 font-mono">
              {`public async Task<(double distanceInMiles, double durationInMinutes)> GetDistanceAndDurationAsync(
    double startLat, double startLon, double endLat, double endLon, CancellationToken ct = default
)
{
    var fallbackDistance = GeoUtils.CalculateDistance(startLat, startLon, endLat, endLon);
    var fallbackDuration = GeoUtils.EstimateTravelTimeMinutes(fallbackDistance);

    if (!_enableOsrmCached.HasValue)
    {
        using var context = await _dbFactory.CreateDbContextAsync(ct);
        var settings = await context.TenantConfigurations.AsNoTracking().FirstOrDefaultAsync(ct);
        _enableOsrmCached = settings?.EnableOsrmTravel ?? false;
    }

    if (!_enableOsrmCached.Value)
    {
        return (fallbackDistance, fallbackDuration); // Haversine estimate
    }
    
    // Execute live HTTP query against OSRM server endpoint
    ...
}`}
            </pre>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-slate-300">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">
                  Administrative Toggle Setting
                </strong>
                OSRM calculation is configurable at runtime via the
                administrative panel under Core Infrastructure Settings. If OSRM
                is disabled, queries immediately default to the fast,
                client-side math equations.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "palliative",
      category: "Clinical Workflows",
      title: "Palliative & Comfort Care Workflows",
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            Halkyone embeds a dignity-first **Comfort Care Portal** designed to
            manage and monitor advance directives (DNR, DNI, Comfort Care) and
            palliative medications.
          </p>
          <p className="text-slate-300">
            The mobile dashboard separates active comfort treatments into
            distinct regimens:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs">
            <li>
              <strong>Daily Comfort Regimen</strong>: Scheduled routine
              therapies managed by visiting clinicians.
            </li>
            <li>
              <strong>Rescue Breakthrough Therapy</strong>: Immediate
              administration protocols for acute symptoms.
            </li>
          </ul>
          <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 text-slate-300">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">
                  Directives Verification
                </strong>
                Active directives are automatically queried via GraphQL batch
                dataloaders to optimize performance and are displayed with
                legal-status alert badges on the Clinician dashboard panel.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "database",
      category: "Infrastructure",
      title: "PostgreSQL Database Schema",
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            All data persists to a PostgreSQL relational database. EF Core
            handles object-relational mapping, database migrations, and schema
            configurations.
          </p>
          <p className="text-slate-300">
            The core config schema settings are stored in the
            `TenantConfigurations` table, which was recently updated to support
            OSRM toggle switches.
          </p>
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={() =>
                  copyToClipboard(
                    `migrationBuilder.AddColumn<bool>(
    name: "enable_osrm_travel",
    table: "tenant_configurations",
    type: "boolean",
    nullable: false,
    defaultValue: false);`,
                    "code-migration",
                  )
                }
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copiedId === "code-migration" ? (
                  <Check className="w-3 h-3 text-teal-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="p-5 rounded-xl bg-[#080c14] border border-white/5 overflow-x-auto text-xs text-teal-300 font-mono">
              {`// EF Core Migration: AddEnableOsrmTravelSetting.cs
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<bool>(
        name: "enable_osrm_travel",
        table: "tenant_configurations",
        type: "boolean",
        nullable: false,
        defaultValue: false);
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(
        name: "enable_osrm_travel",
        table: "tenant_configurations");
}`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      category: "Infrastructure",
      title: "Passwordless Device Trust Binding",
      icon: <Lock className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300">
            Halkyone enforces **Passwordless Magic Link Verification** combined
            with cryptographic hardware device binding to defend against
            unauthorized session hijackings.
          </p>
          <h4 className="font-bold text-white mt-4">Verification Flow:</h4>
          <ol className="space-y-4 list-decimal pl-5 text-slate-300">
            <li>
              <strong>Magic Link Dispatch</strong>: A unique, single-use token
              containing device trust parameters is securely generated and sent
              to the user via SMS or authenticated email channels.
            </li>
            <li>
              <strong>Hardware Lock Verification</strong>: The client
              browser/native wrapper captures the local hardware-based
              `deviceId` stored in secure hardware storage, verifying that it
              aligns with the device context that initiated the authentication
              request.
            </li>
            <li>
              <strong>Validation Sandbox</strong>: In local development, EMR
              routes detect the dev workspace environment configuration and
              properly route authentication redirection handlers to target port
              bindings (`3672` or `3682`).
            </li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      <Background />

      <Navbar
        isAuthenticated={isAuthenticated}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsChangelogOpen={setIsChangelogOpen}
        isSubPage={true}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-24">
        {/* Banner Title */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <BookOpen className="w-4 h-4" /> Platform Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Developer Docs
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Complete technical specification and developer guides for the
            Halkyone Clinical Operating System.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Left Sidebar Table of Contents */}
          <div className="lg:col-span-1 space-y-8">
            <div className="sticky top-28 p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                Documentation Modules
              </h2>
              <div className="space-y-6">
                {/* Group categories */}
                {Array.from(new Set(sections.map((s) => s.category))).map(
                  (cat) => (
                    <div key={cat} className="space-y-2">
                      <h3 className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                        {cat}
                      </h3>
                      <div className="flex flex-col gap-1 border-l border-white/5 pl-3">
                        {sections
                          .filter((s) => s.category === cat)
                          .map((sec) => (
                            <button
                              key={sec.id}
                              onClick={() => setActiveSection(sec.id)}
                              className={`text-left text-xs py-2 transition-all flex items-center justify-between group ${
                                activeSection === sec.id
                                  ? "text-white font-bold"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {sec.icon} {sec.title}
                              </span>
                              <ChevronRight
                                className={`w-3 h-3 transition-transform ${
                                  activeSection === sec.id
                                    ? "opacity-100 translate-x-0.5"
                                    : "opacity-0"
                                }`}
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Right Content Pane */}
          <div className="lg:col-span-3">
            <div className="p-8 md:p-12 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-md relative overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.02] to-transparent pointer-events-none" />

              {sections.map((sec) => {
                if (sec.id !== activeSection) return null;
                return (
                  <motion.div
                    key={sec.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                      {sec.category}
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      {sec.title}
                    </h2>
                    <hr className="border-white/5 my-6" />
                    <div className="text-slate-400 space-y-4">
                      {sec.content}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ChangelogModal
        open={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );
}
