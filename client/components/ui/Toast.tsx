import { toast } from "sonner";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      className: "bg-surface border-green-600/50 text-white",
    });
  },
  error: (message: string) => {
    toast.error(message, {
      className: "bg-surface border-red-600/50 text-white",
    });
  },
  info: (message: string) => {
    toast.info(message, {
      className: "bg-surface border-blue-600/50 text-white",
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      className: "bg-surface border-yellow-600/50 text-white",
    });
  },
};

export default showToast;
