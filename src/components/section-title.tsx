"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
};

export default function SectionTitle({
  children,
}: Props) {
  return (
    <motion.h2
      initial={{
        opacity: 0,
        y: 10,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      viewport={{
        once: true,
      }}
      className="text-2xl font-bold tracking-tight"
    >
      {children}
    </motion.h2>
  );
}