"use client";

import CountUp from "react-countup";

type Props = {
  value: number;
};

export default function AnimatedCounter({
  value,
}: Props) {
  return (
    <CountUp
      end={value}
      duration={1.8}
      separator=","
    />
  );
}