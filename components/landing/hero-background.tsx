export default function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(8_87_254/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(8_87_254/0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-brand/25 blur-3xl motion-safe:animate-aurora" />
      <div className="absolute -right-24 top-10 size-[28rem] rounded-full bg-sky-400/20 blur-3xl motion-safe:animate-aurora motion-safe:[animation-delay:-6s]" />
      <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-indigo-500/20 blur-3xl motion-safe:animate-aurora motion-safe:[animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_var(--mx,50%)_var(--my,50%),rgb(8_87_254/0.12),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100" />
    </div>
  );
}
