import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  register?: UseFormRegisterReturn;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, register, icon, suffix, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white transition-colors">
              {icon}
            </div>
          )}
          <input
            {...props}
            {...register}
            ref={(node) => {
              // Handle register ref
              if (register?.ref) {
                if (typeof register.ref === "function") {
                  register.ref(node);
                } else {
                  (register.ref as any).current = node;
                }
              }
              // Handle forwardRef
              if (ref) {
                if (typeof ref === "function") {
                  ref(node);
                } else {
                  (ref as any).current = node;
                }
              }
            }}
            type={inputType}
            className={cn(
              "w-full bg-[#333] border-none rounded-lg text-white px-4 py-3 placeholder:text-muted focus:bg-[#454545] focus:ring-2 focus:ring-primary outline-none transition-all duration-200",
              icon && "pl-11",
              (isPassword || suffix) && "pr-11",
              error && "ring-2 ring-red-500 focus:ring-red-500",
              className
            )}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          ) : suffix ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          ) : null}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
