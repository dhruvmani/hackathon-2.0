"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";
import { User, Mail, Calendar, Edit3, Film } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

const ProfilePage = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const initials = user.name[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 md:px-12 max-w-4xl mx-auto">
        <section className="bg-surface rounded-lg border border-border overflow-hidden mb-8">
          {/* Cover Header */}
          <div className="h-32 bg-primary/20 border-b border-border" />
          
          <div className="p-8 -mt-16 flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-primary flex items-center justify-center text-5xl font-bebas shadow-2xl border-4 border-surface">
              {initials}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-4xl font-bebas tracking-wide mb-1">{user.name}</h1>
              <p className="text-muted flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
            </div>
            <div className="pb-2">
              <Button 
                variant="secondary" 
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => showToast.info("Profile editing coming soon!")}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-border pb-2">Account Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">User ID</span>
                  <span className="font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Account Status</span>
                  <span className="text-green-500 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Member Since</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-border pb-2">Your Activity</h3>
              <Alert 
                variant="info" 
                message="Your reviews appear on each movie's detail page." 
              />
              <Link href="/browse">
                <Button variant="ghost" className="w-full mt-4 bg-white/5 border border-white/10" icon={<Film className="w-4 h-4" />}>
                  Browse Movies
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
