"use client";

import { motion } from "framer-motion";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PageWrapper({
  children,
}: Props) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -20,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}