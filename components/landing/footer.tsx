"use client";

import { Logo } from "@/components/shared/logo";
import { publicEnv } from "@/lib/solana/env";

import AnimatedContent from "./animated-content";
import { HeaderMarks } from "./header-marks";

export default function LandingFooter() {
  return (
    <footer className="px-4 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto max-w-7xl border-x border-border px-4 pt-40 md:px-12">
        <div className="relative flex flex-col overflow-hidden rounded-t-2xl bg-linear-to-t from-muted to-muted/50 p-8 pb-32 md:flex-row md:items-start md:justify-between md:p-12 md:pb-[10.5rem]">
          <div className="absolute -bottom-18 left-0 h-62 w-auto select-none opacity-[0.07] pointer-events-none">
            <Logo width={135} height={135} />
          </div>
          <AnimatedContent distance={40} className="max-w-72">
            <div className="flex items-center gap-4">
              <Logo />
              <span className="text-xl font-bold text-foreground">Cypher</span>
            </div>
            <p className="mt-4 pb-6 text-muted-foreground">
              For further assistance or additional inquiries, feel free to
              contact us.
            </p>
          </AnimatedContent>
          <AnimatedContent>
            <HeaderMarks xUrl={publicEnv.xUrl} ca={publicEnv.ca} />
          </AnimatedContent>
        </div>
      </div>
    </footer>
  );
}
