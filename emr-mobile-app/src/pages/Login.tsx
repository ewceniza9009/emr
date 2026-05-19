import React, { useState, useEffect } from "react";
import { IonContent, IonPage, IonIcon, IonSpinner } from "@ionic/react";
import {
  shieldCheckmark,
  link as linkIcon,
  copy as copyIcon,
  settings as settingsIcon,
  alertCircle,
  checkmarkCircle,
  sparkles,
  globeOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const { login, magicLogin, apiUrl, setApiUrl, isAuthenticated } = useAuth();
  const [magicToken, setMagicToken] = useState("DEMO_MAGIC_MRN-99999");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);

  const [isTokenVerifying, setIsTokenVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState<
    "idle" | "verifying" | "success" | "failed"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCopied, setIsCopied] = useState(false);

  // Sync temp API URL state with context changes
  useEffect(() => {
    setTempApiUrl(apiUrl);
  }, [apiUrl]);

  const handleMagicLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await magicLogin(magicToken);
      setSuccessMessage("Passwordless authentication successful!");
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Authentication failed. Please verify the API server is running.",
      );
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setErrorMessage("Please provide both email and password.");
      return;
    }
    try {
      await login(email, password);
      setSuccessMessage("Login successful!");
    } catch (err: any) {
      setErrorMessage(err.message || "Credentials login failed.");
    }
  };

  const handleTokenLinkSimulation = () => {
    if (isTokenVerifying) return;

    setIsTokenVerifying(true);
    setVerifyStep("verifying");
    setErrorMessage(null);
    setSuccessMessage(null);

    // Simulate highly premium verification sequences
    setTimeout(() => {
      // Step 2: Verification Success
      setVerifyStep("success");

      setTimeout(async () => {
        try {
          // Log in as the seeded patient (Pearline Bauch, MRN-99999)
          await magicLogin("DEMO_MAGIC_MRN-99999");
          setIsTokenVerifying(false);
          setVerifyStep("idle");
        } catch (err: any) {
          setVerifyStep("failed");
          setIsTokenVerifying(false);
          setErrorMessage(
            "Token verified but API authentication failed. Make sure dotnet server is running!",
          );
        }
      }, 1000);
    }, 2200);
  };

  const handleCopyMagicLink = () => {
    const currentOrigin = window.location.origin;
    const generatedLink = `${currentOrigin}/login?token=${magicToken}`;

    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    setApiUrl(tempApiUrl);
    setShowSettings(false);
    setSuccessMessage(`API Server URL redirected to: ${tempApiUrl}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <IonPage className="dark bg-[#020408]" style={{ background: "#020408" }}>
      <IonContent
        scrollY={true}
        style={
          {
            "--background": "#020408",
            "--color": "#ffffff",
          } as React.CSSProperties
        }
        className="ion-padding relative overflow-hidden dark"
      >
        {/* Modern Vibrant Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />

        <div className="flex flex-col min-h-full justify-between py-6 max-w-md mx-auto">
          {/* Header & Logo */}
          <div className="text-center space-y-2 mt-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-teal-500/15 to-emerald-500/15 border border-teal-500/30 text-teal-400 shadow-[0_0_24px_rgba(20,184,166,0.1)]">
              <IonIcon icon={sparkles} className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                Halkyone{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  Clinical OS
                </span>
              </h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                Virtual Hospital Room Portal
              </p>
            </div>
          </div>

          {/* Core Interactive Biometric or Access Box */}
          <div className="my-8 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] leading-relaxed flex items-start gap-2 animate-shake">
                <IonIcon
                  icon={alertCircle}
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-relaxed flex items-start gap-2">
                <IonIcon
                  icon={checkmarkCircle}
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Mock Token Link Verification Overlay */}
            {isTokenVerifying ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-fadeIn">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Outer Pulsing Rings */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 ${
                      verifyStep === "success"
                        ? "border-emerald-500/30"
                        : "border-teal-500/30"
                    } animate-ping`}
                    style={{ animationDuration: "2s" }}
                  />

                  <div
                    className={`w-24 h-24 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center shadow-inner relative overflow-hidden`}
                  >
                    {/* Laser Sweep Effect */}
                    {verifyStep === "verifying" && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_10px_#14b8a6] animate-scan-sweep pointer-events-none" />
                    )}

                    <IonIcon
                      icon={
                        verifyStep === "success" ? shieldCheckmark : linkIcon
                      }
                      className={`w-12 h-12 transition-all duration-300 ${
                        verifyStep === "success"
                          ? "text-emerald-400 scale-110"
                          : "text-teal-400 animate-pulse"
                      }`}
                    />
                  </div>
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {verifyStep === "verifying"
                      ? "Verifying Secure Token..."
                      : "Token Verified!"}
                  </h3>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal">
                    {verifyStep === "verifying"
                      ? "Checking cryptographic signature & token status..."
                      : "Authorizing session and opening virtual hospital room..."}
                  </p>
                </div>
              </div>
            ) : (
              /* Idle Forms / Options */
              <div className="space-y-6">
                {/* Token Link Simulator Card */}
                <button
                  onClick={handleTokenLinkSimulation}
                  className="w-full rounded-[24px] p-6 bg-gradient-to-br from-[#090d16] to-[#03050a] border border-[#1e293b] hover:border-teal-500/50 hover:bg-slate-950/80 active:scale-[0.98] flex flex-col items-center justify-center space-y-2 group cursor-pointer transition-all duration-200"
                >
                  <div className="p-3.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:bg-teal-500/20 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(20,184,166,0.05)]">
                    <IonIcon icon={linkIcon} className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase text-teal-400 tracking-wider">
                      Simulate Token Link Verification
                    </span>
                    <p className="text-[9px] text-slate-500 max-w-[200px] leading-normal mx-auto mt-0.5">
                      Verify secure token link authentication for instant local evaluation
                    </p>
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-[1px] bg-slate-800 flex-grow" />
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                    Or Magic Token Bypass
                  </span>
                  <div className="h-[1px] bg-slate-800 flex-grow" />
                </div>

                {/* Passwordless Magic Token input */}
                <form onSubmit={handleMagicLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black tracking-widest text-slate-550 block">
                      Demo Magic Token / MRN
                    </label>
                    <div className="flex items-center justify-between rounded-2xl border border-[#1e293b] bg-[#070a13] pl-4 pr-1.5 py-1.5 focus-within:border-teal-500/50 transition-all gap-2">
                      <div className="flex items-center flex-grow min-w-0">
                        <IonIcon
                          icon={linkIcon}
                          className="text-teal-500 w-4 h-4 mr-3 shrink-0"
                        />
                        <input
                          type="text"
                          value={magicToken}
                          onChange={(e) => setMagicToken(e.target.value)}
                          placeholder="DEMO_MAGIC_MRN-99999"
                          className="bg-transparent border-none outline-none text-white text-xs font-semibold w-full"
                        />
                      </div>

                      {/* Integrated Copy Action Suffix */}
                      <button
                        type="button"
                        onClick={handleCopyMagicLink}
                        className="!rounded-[10px] px-3 py-2 bg-[#111827] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-slate-700 active:scale-95 shrink-0 relative flex items-center justify-center cursor-pointer transition-all duration-200"
                        title="Copy Magic Access Link to clipboard"
                      >
                        <IonIcon icon={copyIcon} className="w-3.5 h-3.5" />
                        {isCopied && (
                          <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-800 text-emerald-400 text-[8px] font-bold uppercase tracking-widest py-1 px-2 rounded-md shadow-lg animate-fadeIn whitespace-nowrap z-50">
                            Copied!
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-[52px] !rounded-2xl px-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-[11px] uppercase tracking-[0.15em] border-none shadow-[0_4px_20px_rgba(13,148,136,0.3)] active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                  >
                    Authenticate Token
                  </button>
                </form>

                {/* Generator Notice */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-[10px] text-slate-500 leading-normal flex gap-2 mt-4">
                  <IonIcon
                    icon={globeOutline}
                    className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="text-slate-400">
                      Passwordless Bypass Flow:
                    </strong>{" "}
                    Click the copy button to capture a Magic Access Link.
                    Opening it via browser automatically validates and signs you
                    in!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer controls & Settings Bridge */}
          <div className="space-y-4 px-2">
            {/* Settings Trigger */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-550 hover:text-slate-450 uppercase tracking-widest bg-transparent border-0 cursor-pointer py-1.5 px-3 rounded-full hover:bg-slate-900/30 transition-all"
              >
                <IonIcon icon={settingsIcon} className="w-3.5 h-3.5" />
                <span>API Server Settings</span>
              </button>
            </div>

            {showSettings && (
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 shadow-xl animate-fadeIn">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-550 block">
                    EMR Backend API Bridge Address
                  </span>
                  <input
                    type="text"
                    value={tempApiUrl}
                    onChange={(e) => setTempApiUrl(e.target.value)}
                    placeholder="https://localhost:34731"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 outline-none text-xs text-white placeholder-slate-655 focus:border-teal-500/50"
                  />
                  <span className="text-[8px] text-slate-600 block leading-normal mt-0.5">
                    • Default browser environment:{" "}
                    <strong className="text-slate-500">
                      https://localhost:34731
                    </strong>
                    <br />• Default Android emulator environment:{" "}
                    <strong className="text-slate-500">
                      https://10.0.2.2:34731
                    </strong>
                  </span>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                >
                  Save API Configuration
                </button>
              </div>
            )}

            <div className="text-center">
              <span className="text-[9px] text-slate-600 uppercase font-medium block">
                Halkyone Clinical Platform v1.2.4 (Tactical Mobile client)
              </span>
              <span className="text-[8px] text-slate-700 block mt-0.5">
                Authorized clinical personnel only. All access is audited in
                accordance with HIPAA standards.
              </span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
