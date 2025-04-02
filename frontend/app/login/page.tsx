"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { setToken, isLoggedIn } from "../utils/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save the token using our utility
      setToken(data.token);

      // Also save the user ID for future use
      if (data.user && data.user.id) {
        localStorage.setItem("userId", data.user.id.toString());
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card-bg border border-card-border text-card-fg rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            Login to Your Account
          </h1>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-card-fg mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-card-fg mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-primary-fg py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-card-fg/80">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
