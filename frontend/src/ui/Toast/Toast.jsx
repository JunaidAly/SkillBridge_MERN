import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const variants = {
  success: {
    icon: CheckCircle,
    className: "bg-green-50 border-green-200 text-green-800",
    iconClass: "text-green-500",
  },
  error: {
    icon: XCircle,
    className: "bg-red-50 border-red-200 text-red-800",
    iconClass: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconClass: "text-yellow-500",
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClass: "text-blue-500",
  },
};

function Toast({ id, message, type = "info", onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg
        font-family-poppins text-sm transition-all duration-200 ease-out
        ${variant.className}
        ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <Icon className={`shrink-0 ${variant.iconClass}`} size={20} />
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;
