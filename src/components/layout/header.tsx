"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, MapPin } from "lucide-react";

export function Header() {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Compass className="w-7 h-7 text-[#FF8C42] group-hover:rotate-12 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#FF8C42]/20 blur-xl rounded-full" />
            </div>
            <span className="text-lg font-bold text-white">
              Trip
              <span className="gradient-text">Planner</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-[#CBD5E1] hover:text-white transition-colors text-sm"
            >
              功能特色
            </a>
            <a
              href="#how-it-works"
              className="text-[#CBD5E1] hover:text-white transition-colors text-sm"
            >
              使用指南
            </a>
            <a
              href="#plan"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8C42]/10 text-[#FF8C42] border border-[#FF8C42]/20 hover:bg-[#FF8C42]/20 transition-all text-sm"
            >
              <MapPin className="w-4 h-4" />
              开始规划
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
