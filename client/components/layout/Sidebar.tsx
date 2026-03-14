"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    { label: "Movies", href: "/admin/movies", icon: Film },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  return (
    <aside className="w-full md:w-64 bg-surface border-r border-border min-h-[auto] md:min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bebas tracking-wider text-muted uppercase">Admin Dashboard</h2>
      </div>
      <nav className="px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted hover:text-white hover:bg-[#2a2a2a]"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
