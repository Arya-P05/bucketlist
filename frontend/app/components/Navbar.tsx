"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, removeToken } from "../utils/auth";
import ThemeToggle from "./ThemeToggle";
import { initTheme } from "../utils/theme";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme
    initTheme();
    // Check if user is logged in
    setLoggedIn(isLoggedIn());
  }, []);

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
    window.location.href = "/login";
  };

  return (
    <nav className="bg-primary text-primary-fg shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-xl font-bold">
          Bucket List App
        </Link>

        <div className="flex items-center space-x-6">
          <div className="space-x-4">
            <Link href="/" className="hover:text-primary-fg/80">
              Home
            </Link>

            {loggedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-primary-fg/80">
                  My Lists
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-primary-fg/80"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-primary-fg/80">
                  Login
                </Link>
                <Link href="/signup" className="hover:text-primary-fg/80">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
