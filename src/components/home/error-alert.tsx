"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
        >
          重试
        </button>
      )}
    </motion.div>
  );
}
