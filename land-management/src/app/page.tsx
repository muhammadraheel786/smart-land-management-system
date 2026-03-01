"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Brain, BarChart3, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, email: userEmail } = await api.login(email, password);
      login(token, userEmail);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col lg:flex-row bg-theme relative overflow-hidden">
      {/* Dynamic Background Images / Visuals for Land */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Lush green farm land"
          fill
          style={{ objectFit: "cover" }}
          className="opacity-40 animate-pulse-slow"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-theme backdrop-blur-[2px]"></div>
      </div>

      <section
        className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-between p-8 xl:p-16"
        aria-label="About Mashori Farm"
      >
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30" aria-hidden>
            <Map className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Mashori Farm</h1>
            <p className="text-emerald-300 font-medium">Smart Land & Farm Management</p>
          </div>
        </div>

        <div className="animate-slide-up-fade">
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Cultivate success with <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">AI-Powered</span> Insights.
          </h2>
          <p className="text-emerald-100 max-w-lg mb-10 text-lg leading-relaxed mix-blend-lighten">
            Experience the future of agriculture. Digital geographic mapping, automated financial tracking, and predictive AI recommendations explicitly designed for modern landowners.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">Advanced Analytics</span>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-white font-medium">Predictive AI</span>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 flex-1">
        {/* Mobile Background */}
        <div className="absolute inset-0 z-0 block lg:hidden">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Farm background"
            fill
            style={{ objectFit: "cover" }}
            className="opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-theme/80 backdrop-blur-sm"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-10 mt-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20" aria-hidden>
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="font-black text-white text-3xl tracking-tight">Mashori Farm</h1>
              <p className="text-theme-muted mt-1 font-medium">Smart Land Management</p>
            </div>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme shadow-2xl rounded-3xl p-6 sm:p-8 w-full transform transition-all animate-slide-up-fade">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme mb-2">Welcome back</h2>
            <p className="text-theme-muted mb-8 text-sm sm:text-base">Enter your credentials to access your dashboard</p>

            <form onSubmit={handleLogin} className="space-y-5" aria-label="Sign in to Mashori Farm">
              <div className="space-y-1 block group">
                <label htmlFor="login-email" className="block text-sm font-semibold text-theme-muted group-focus-within:text-green-500 transition-colors">Email Address</label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-4 pr-10 py-3.5 min-h-[52px] rounded-xl bg-theme-track border border-theme text-theme placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 block group">
                <label htmlFor="login-password" className="block text-sm font-semibold text-theme-muted group-focus-within:text-green-500 transition-colors">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 min-h-[52px] rounded-xl bg-theme-track border border-theme text-theme placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base shadow-sm"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl animate-shake">
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 min-h-[52px] mt-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-70 disabled:hover:shadow-none overflow-hidden group touch-manipulation"
              >
                <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${loading ? "scale-95" : "group-hover:scale-105"}`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </span>

                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
              </button>
            </form>
          </div>

          <p className="text-center text-theme-muted text-xs mt-8">
            © {new Date().getFullYear()} Mashori Farm. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
