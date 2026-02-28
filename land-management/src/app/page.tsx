"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Brain, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-theme flex flex-col lg:flex-row">
      <section
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600/20 to-emerald-800/20 border-r border-theme flex-col justify-between p-8 xl:p-12"
        aria-label="About Mashori Farm"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0" aria-hidden>
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mashori Farm</h1>
            <p className="text-sm text-theme-muted">Smart Land & Farm Management</p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl xl:text-3xl font-bold text-white mb-4">AI-Powered Land Management</h2>
          <p className="text-theme-muted max-w-md mb-8 text-sm xl:text-base">
            Digital maps, financial tracking, and AI insights for landowners. Draw your land, track expenses, manage Thaka, and get smart recommendations.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-theme-muted text-sm xl:text-base">
              <BarChart3 className="w-5 h-5 text-green-400 shrink-0" aria-hidden />
              <span>Analytics & Reports</span>
            </div>
            <div className="flex items-center gap-2 text-theme-muted text-sm xl:text-base">
              <Brain className="w-5 h-5 text-green-400 shrink-0" aria-hidden />
              <span>AI Recommendations</span>
            </div>
          </div>
        </div>
      </section>
      <main className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 flex-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0" aria-hidden>
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Mashori Farm</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-theme-muted mb-6 sm:mb-8 text-sm sm:text-base">Sign in to manage your land</p>
          <form onSubmit={handleLogin} className="space-y-4" aria-label="Sign in to Mashori Farm">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-theme-muted mb-2">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-theme-card border border-theme text-theme placeholder-theme focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-theme-muted mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-theme-card border border-theme text-theme placeholder-theme focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[48px] rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-60 text-base touch-manipulation"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
