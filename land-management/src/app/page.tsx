"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Brain, BarChart3, ChevronRight, Loader2, Leaf, Shield, Globe } from "lucide-react";
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
    <div className="min-h-screen min-h-dvh flex flex-col bg-theme relative">
      {/* Navbar Minimal */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <Map className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SmartFarm</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row w-full h-full relative z-10">
        {/* Left Side: Hero Information */}
        <section className="relative w-full lg:w-3/5 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-24 bg-theme-track/60 backdrop-blur-3xl overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-40 -left-60 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-700/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto lg:mx-0 pt-16 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm mb-8 animate-fade-in">
              <Leaf className="w-4 h-4" />
              <span>Next Generation Land Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.1] animate-slide-up-fade" style={{ animationDelay: "100ms" }}>
              Cultivate success with <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Intelligent Insights</span>.
            </h1>

            <p className="text-lg text-theme-muted mb-10 max-w-xl leading-relaxed animate-slide-up-fade" style={{ animationDelay: "200ms" }}>
              Experience the future of agriculture. Comprehensive geographic mapping, automated financial tracking, and predictive AI recommendations explicitly designed for modern landowners.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up-fade" style={{ animationDelay: "300ms" }}>
              <FeatureCard icon={<BarChart3 className="w-5 h-5 text-green-400" />} title="Financial Tracking" desc="Monitor expenses, income, and overall profit beautifully." />
              <FeatureCard icon={<Globe className="w-5 h-5 text-emerald-400" />} title="Geographic Mapping" desc="Map fields precisely with satellite integration." />
              <FeatureCard icon={<Brain className="w-5 h-5 text-purple-400" />} title="Predictive AI" desc="Get tailored crop and soil recommendations." />
              <FeatureCard icon={<Shield className="w-5 h-5 text-blue-400" />} title="Secure Records" desc="Keep leases and tenancy data safe and organized." />
            </div>
          </div>
        </section>

        {/* Right Side: Login Form with Background Image */}
        <main className="relative w-full lg:w-2/5 flex flex-col items-center justify-center p-6 lg:p-12 min-h-[60vh] lg:min-h-screen border-l border-theme">
          {/* Dynamic Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Lush green farm land"
              fill
              style={{ objectFit: "cover" }}
              className="opacity-30"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-theme via-theme/90 to-theme/60 backdrop-blur-[4px]"></div>
          </div>

          <div className="w-full max-w-md relative z-10 mt-10 lg:mt-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="bg-theme-card/90 backdrop-blur-2xl border border-theme shadow-2xl rounded-3xl p-8 w-full">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-theme-muted mb-8 text-sm">Sign in to your dashboard to manage your fields.</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-sm font-medium text-theme-muted">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl bg-theme focus:bg-theme-card border border-theme text-white placeholder-theme/50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-sm font-medium text-theme-muted">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-xl bg-theme focus:bg-theme-card border border-theme text-white placeholder-theme/50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-4 mt-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-all disabled:opacity-70 disabled:hover:bg-green-600 overflow-hidden group shadow-lg shadow-green-900/20"
                >
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>

            <p className="text-center text-theme-muted text-xs mt-8">
              © {new Date().getFullYear()} SmartFarm Land Management.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-sm mt-1">{title}</h3>
      <p className="text-theme-muted text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

