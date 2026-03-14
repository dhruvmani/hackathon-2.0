"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

const RegisterPage = () => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/browse");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-primary text-5xl font-bebas tracking-tighter mb-2">
            NETFLIXCLONE
          </h1>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border p-8 md:p-12 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold mb-8">Sign Up</h2>
          
          <RegisterForm />

          <div className="mt-8 text-muted text-sm flex gap-1">
            Already have an account?
            <Link href="/login" className="text-white hover:underline font-medium">
              Sign in now.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
