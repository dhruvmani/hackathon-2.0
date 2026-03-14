"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md" }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          "relative w-full bg-surface border border-border rounded-lg shadow-2xl transition-all duration-200",
          sizes[size],
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          {title && <h2 className="text-2xl font-bebas tracking-wide">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a2a2a] rounded-full transition-colors text-muted hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
