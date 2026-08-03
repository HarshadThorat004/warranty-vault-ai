"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({
  children,
  className = "",
}: Props) {
  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.01,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        shadow-[0_0_30px_rgba(255,255,255,0.03)]
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}