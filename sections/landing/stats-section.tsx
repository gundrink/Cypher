import AnimatedContent from "@/components/landing/animated-content";
import CountUp from "@/components/landing/count-number";

const STATS = [
  { value: 100, label: "Private transactions" },
  { value: 60, label: "Less exposure on-chain" },
  { value: 99.9, label: "Reliable stealth delivery" },
];

export default function StatsSection() {
  return (
    <section className="border-y border-border px-4 py-10 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STATS.map((stat, index) => (
          <AnimatedContent
            key={stat.label}
            distance={40}
            delay={index * 0.12}
            className="group flex flex-col items-center gap-4 rounded-2xl py-4 text-center transition-colors duration-300 hover:bg-brand-muted/60"
          >
            <h3 className="bg-gradient-to-br from-foreground to-brand bg-clip-text font-urbanist text-4xl font-semibold text-transparent transition-transform duration-300 group-hover:scale-110">
              <CountUp from={0} to={stat.value} />%
            </h3>
            <p className="text-muted-foreground">{stat.label}</p>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}
