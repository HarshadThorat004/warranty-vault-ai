export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/[0.07] blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-white/[0.03] blur-3xl" />
    </div>
  );
}
