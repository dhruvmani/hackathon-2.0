"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, LogOut, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userInitial = user?.name ? user.name[0].toUpperCase() : "?";

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-40 transition-colors duration-300 px-4 md:px-12 py-4 flex items-center justify-between",
        isScrolled ? "bg-black/90 backdrop-blur-md border-b border-border" : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      <div className="flex items-center gap-8">
        <Link href="/browse" className="text-primary text-3xl font-bebas tracking-tighter">
          NETFLIXCLONE
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/browse" className="hover:text-muted transition-colors">Home</Link>
          <Link href="/browse?genre=Action" className="hover:text-muted transition-colors">Movies</Link>
          <Link href="/browse?genre=New" className="hover:text-muted transition-colors">New & Popular</Link>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-sm">
            {userInitial}
          </div>
          <ChevronDown className={cn("w-4 h-4 text-white transition-transform duration-200", isMenuOpen && "rotate-180")} />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 mt-3 w-56 bg-black border border-border rounded-lg shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border mb-2">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              
              <Link
                href="/profile"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[#1a1a1a] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                My Profile
              </Link>
              
              <Link
                href="/admin/movies"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[#1a1a1a] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>

              <div className="h-px bg-border my-2" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-[#1a1a1a] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
