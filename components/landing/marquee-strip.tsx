import { SparkleIcon } from "lucide-react";

const HIGHLIGHTS = [
  "Stealth addresses",
  "Built on Solana",
  "Non-custodial",
  "On-chain usernames",
  "x25519 key exchange",
  "No address reuse",
  "Private by default",
];

export default function MarqueeStrip() {
  return (
    <section
      aria-label="Cypher highlights"
      className="relative overflow-hidden border-t border-border bg-muted/40 py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <div className="flex w-max motion-safe:animate-marquee hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
          >
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 whitespace-nowrap px-6 font-urbanist text-lg font-medium text-muted-foreground"
              >
                <SparkleIcon className="size-4 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
