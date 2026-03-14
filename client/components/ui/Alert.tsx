import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

const icons: Record<AlertVariant, React.FC<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const variants: Record<AlertVariant, string> = {
  info: "bg-blue-600/10 border-blue-600/50 text-blue-500",
  success: "bg-green-600/10 border-green-600/50 text-green-500",
  warning: "bg-yellow-600/10 border-yellow-600/50 text-yellow-500",
  error: "bg-red-600/10 border-red-600/50 text-red-500",
};

const Alert: React.FC<AlertProps> = ({ variant = "info", title, message, onClose, dismissible, className }) => {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex items-start p-4 border rounded-lg",
        variants[variant],
        className
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        {title && <h3 className="font-bold mb-1">{title}</h3>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="ml-3 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
