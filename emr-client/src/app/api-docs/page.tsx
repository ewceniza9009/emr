"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Terminal, 
  ChevronRight, 
  Copy, 
  Check, 
  Code2, 
  Cpu, 
  FileCode,
  Globe,
  Database,
  Lock,
  Compass
} from "lucide-react";
import { motion } from "framer-motion";
import { Background, Navbar, Footer, ChangelogModal } from "@/components/Landing";

interface APIEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "MUTATION";
  path: string;
  title: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; desc: string }[];
  codeSnippets: { lang: string; code: string }[];
  responsePayload: string;
}

export default function ApiDocsPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeEndpointId, setActiveEndpointId] = useState("magic-link");
  const [activeLang, setActiveLang] = useState("curl");
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

  const endpoints: APIEndpoint[] = [
    {
      id: "magic-link",
      method: "POST",
      path: "/api/auth/magic-link",
      title: "Request Passwordless Login",
      description: "Generates a single-use secure login token and dispatches it via SMS/email channel to the clinician or practitioner device.",
      parameters: [
        { name: "email", type: "string", required: true, desc: "Primary practitioner email registered under the tenant." },
        { name: "deviceId", type: "string", required: false, desc: "Unique hardware ID of the mobile device to verify secure trust binding." }
      ],
      codeSnippets: [
        {
          lang: "curl",
          code: `curl -X POST https://api.halkyone.health/api/auth/magic-link \\
  -H "Content-Type: application/json" \\
  -d '{"email": "practitioner@halkyone.health", "deviceId": "hw-2983x"}'`
        },
        {
          lang: "javascript",
          code: `fetch('https://api.halkyone.health/api/auth/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'practitioner@halkyone.health',
    deviceId: 'hw-2983x'
  })
}).then(res => res.json());`
        }
      ],
      responsePayload: `{
  "success": true,
  "message": "Magic link dispatched successfully",
  "expiresIn": 900
}`
    },
    {
      id: "graphql-toggle",
      method: "MUTATION",
      path: "/graphql",
      title: "Update OSRM Travel Toggle Settings",
      description: "Allows EMR administrator configurations to enable or disable live OSRM routing calculations for logistics queries.",
      parameters: [
        { name: "input.enableOsrmTravel", type: "boolean", required: true, desc: "Set to true to calculate drive times with OSRM, or false to use Haversine fallback calculations." },
        { name: "input.engineSafetyDriveMins", type: "int", required: false, desc: "Safety buffer in minutes padding drive-time requirements." }
      ],
      codeSnippets: [
        {
          lang: "curl",
          code: `curl -X POST https://api.halkyone.health/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query": "mutation($input: UpdateTenantConfigurationInput!) { updateTenantConfiguration(input: $input) { success tenant { enableOsrmTravel } } }", "variables": { "input": { "enableOsrmTravel": true } }}'`
        },
        {
          lang: "javascript",
          code: `const query = \`
  mutation($input: UpdateTenantConfigurationInput!) {
    updateTenantConfiguration(input: $input) {
      success
      tenant {
        enableOsrmTravel
      }
    }
  }
\`;

fetch('https://api.halkyone.health/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { input: { enableOsrmTravel: true } } })
});`
        }
      ],
      responsePayload: `{
  "data": {
    "updateTenantConfiguration": {
      "success": true,
      "tenant": {
        "enableOsrmTravel": true
      }
    }
  }
}`
    },
    {
      id: "clinician-coords",
      method: "GET",
      path: "/api/clinicians/{id}/location",
      title: "Query Clinician Transit Coordinates",
      description: "Returns the latest real-time dispatch GPS telemetry coordinates of a transit clinician, masked with a 500m geofence for safety protection.",
      parameters: [
        { name: "id", type: "string (Guid)", required: true, desc: "Unique identifier of the transit clinician." }
      ],
      codeSnippets: [
        {
          lang: "curl",
          code: `curl https://api.halkyone.health/api/clinicians/4a9d74cb/location \\
  -H "Authorization: Bearer <token>"`
        },
        {
          lang: "javascript",
          code: `fetch('https://api.halkyone.health/api/clinicians/4a9d74cb/location', {
  headers: { 'Authorization': 'Bearer <token>' }
}).then(res => res.json());`
        }
      ],
      responsePayload: `{
  "clinicianId": "4a9d74cb-29f8-45e3-b3c9-d2b38038933b",
  "status": "Transit",
  "coordinates": {
    "latitude": 10.0245,
    "longitude": 124.0841
  },
  "masked": true,
  "updatedAt": "2026-05-24T23:00:00Z"
}`
    }
  ];

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "POST":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "MUTATION":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const activeEndpoint = endpoints.find(e => e.id === activeEndpointId) || endpoints[0];

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
            <Code2 className="w-4 h-4" /> Developer Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            API Reference
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Integrate Halkyone endpoints directly into custom applications, scheduling orchestrators, and analytics pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                API Endpoints
              </h3>
              <div className="flex flex-col gap-2">
                {endpoints.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => setActiveEndpointId(ep.id)}
                    className={`p-3 rounded-xl text-left transition-all flex flex-col gap-1 border ${
                      activeEndpointId === ep.id
                        ? "bg-teal-500/5 border-teal-500/20 text-white"
                        : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {ep.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeClass(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="text-xs font-mono truncate">{ep.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-md min-h-[500px]">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getMethodBadgeClass(activeEndpoint.method)}`}>
                  {activeEndpoint.method}
                </span>
                <span className="text-sm font-mono text-white font-bold">{activeEndpoint.path}</span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                {activeEndpoint.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {activeEndpoint.description}
              </p>

              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Request Parameters
              </h3>
              {activeEndpoint.parameters.length > 0 ? (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  {activeEndpoint.parameters.map(p => (
                    <div key={p.name} className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-400">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">({p.type})</span>
                        {p.required && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-rose-500">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px]">{p.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No parameters required.</p>
              )}
            </div>
          </div>

          {/* Right Console Sandbox (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-[#080c14] border border-white/5 overflow-hidden">
              {/* Sandbox Tabs */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/5">
                <div className="flex gap-4">
                  {activeEndpoint.codeSnippets.map(cs => (
                    <button
                      key={cs.lang}
                      onClick={() => setActiveLang(cs.lang)}
                      className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                        activeLang === cs.lang ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {cs.lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const code = activeEndpoint.codeSnippets.find(cs => cs.lang === activeLang)?.code || "";
                    copyToClipboard(code, "code-snippet");
                  }}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedId === "code-snippet" ? (
                    <Check className="w-3 h-3 text-teal-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Snippet Block */}
              <div className="p-6 overflow-x-auto text-[11px] font-mono text-teal-300 min-h-[180px]">
                <pre>
                  {activeEndpoint.codeSnippets.find(cs => cs.lang === activeLang)?.code}
                </pre>
              </div>

              {/* Response Block */}
              <div className="border-t border-white/5">
                <div className="px-6 py-3 bg-slate-950 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Response Payload (200 OK)
                  </span>
                  <button
                    onClick={() => copyToClipboard(activeEndpoint.responsePayload, "code-response")}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedId === "code-response" ? (
                      <Check className="w-3 h-3 text-teal-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="p-6 overflow-x-auto text-[11px] font-mono text-emerald-400 bg-black/40">
                  <pre>{activeEndpoint.responsePayload}</pre>
                </div>
              </div>
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
