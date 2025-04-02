"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { isLoggedIn } from "../utils/auth";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (!name || !email || !password) {
      setError("Name, email, and password are required");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Redirect to login page after successful signup
      router.push("/login?signupSuccess=true");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("Signup error:", err);
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
            Create an Account
          </h1>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-card-fg mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                placeholder="Enter your name"
                required
              />
            </div>

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
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-card-fg mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-primary-fg py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-card-fg/80">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
