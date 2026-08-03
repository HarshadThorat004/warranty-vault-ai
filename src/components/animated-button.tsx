"use client";

import Link from "next/link";

import { motion } from "framer-motion";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function AnimatedButton({
  href,
  children,
  className = "",
}: Props) {
  return (
    <motion.div
      whileHover={{
        scale: 1.04,
      }}
      whileTap={{
        scale: 0.96,
      }}
      transition={{
        duration: 0.2,
      }}
    >
      <Link
        href={href}
        className={`
          inline-flex
          items-center
          justify-center
          rounded-2xl
          px-6
          py-4
          font-semibold
          transition-all
          duration-300
          ${className}
        `}
      >
        {children}
      </Link>
    </motion.div>
  );
}