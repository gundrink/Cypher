"use client";

import { motion } from "framer-motion";
import { EyeOff, Lock, ShieldCheck } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface PaymentCard {
  icon: LucideIcon;
  title: string;
  detail: string;
  position: string;
  delay: number;
  floatDelay: string;
}

const CARDS: PaymentCard[] = [
  {
    icon: Lock,
    title: "Received privately",
    detail: "+2.5 SOL · stealth address",
    position: "left-[4%] top-[26%]",
    delay: 0.9,
    floatDelay: "0s",
  },
  {
    icon: EyeOff,
    title: "Sender hidden",
    detail: "@alice → 9axx…Rf3k",
    position: "right-[4%] top-[34%]",
    delay: 1.1,
    floatDelay: "-2s",
  },
  {
    icon: ShieldCheck,
    title: "@bob claimed",
    detail: "Username on Solana",
    position: "left-[9%] bottom-[18%]",
    delay: 1.3,
    floatDelay: "-4s",
  },
];

export default function FloatingPaymentCards() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden xl:block"
    >
      {CARDS.map((card) => (
        <motion.div
          key={card.title}
          className={`absolute ${card.position}`}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: card.delay,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 pr-5 shadow-[0_12px_40px_-12px_rgb(8_87_254/0.35)] backdrop-blur-md motion-safe:animate-float"
            style={{ animationDelay: card.floatDelay }}
          >
            <div className="rounded-xl bg-brand p-2 text-brand-foreground">
              <card.icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {card.title}
              </p>
              <p className="text-xs text-muted-foreground">{card.detail}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
