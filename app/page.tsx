"use client";

import MarqueeStrip from "@/components/landing/marquee-strip";
import ScrollProgress from "@/components/landing/scroll-progress";
import { useWallet } from "@/hooks/useWallet";
import FaqSection from "@/sections/landing/faq-section";
import FeaturesSection from "@/sections/landing/features-section";
import HeroSection from "@/sections/landing/hero-section";
import StatsSection from "@/sections/landing/stats-section";

export default function Home() {
  const { ready } = useWallet();

  if (!ready) {
    return null;
  }

  return (
    <main>
      <ScrollProgress />
      <HeroSection />
      <MarqueeStrip />
      <StatsSection />
      <FeaturesSection />
      <FaqSection />
    </main>
  );
}
