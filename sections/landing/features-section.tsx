"use client";

import { useMemo } from "react";

import Link from "next/link";

import { ArrowUpRightIcon, SparkleIcon } from "lucide-react";

import AnimatedContent from "@/components/landing/animated-content";
import SectionTitle from "@/components/landing/section-title";
import { landingFeatures } from "@/data/landing/features";
import { useWallet } from "@/hooks/useWallet";
import { ROUTES } from "@/lib/constants/routes";
import { hasSession } from "@/lib/utils/session";

export default function FeaturesSection() {
  const { authenticated, ready } = useWallet();

  const appLink = useMemo(() => {
    if (ready && authenticated && hasSession()) {
      return ROUTES.DASHBOARD;
    }
    return ROUTES.LOGIN;
  }, [ready, authenticated]);
  return (
    <section id="features" className="px-4 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 border-x border-border md:grid-cols-2 md:divide-x md:divide-border">
        <div>
          <div className="flex flex-col items-start p-4 pt-16 md:sticky md:top-[6.5rem] md:p-16">
            <SectionTitle
              dir="left"
              icon={SparkleIcon}
              title="Core features"
              subtitle="Everything you need for private crypto—stealth addresses, usernames, and on-chain privacy without exposing your activity."
            />
            <AnimatedContent className="mt-12 w-full rounded-xl bg-brand p-4 md:p-6">
              <p className="text-lg text-brand-foreground">
                Trusted by users who want cash-level privacy on the blockchain.
              </p>
              <Link
                href={appLink}
                className="group mt-6 flex w-max items-center gap-1 rounded-xl bg-brand-foreground px-5 py-2.5 text-brand font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:scale-105"
              >
                Go to App
                <ArrowUpRightIcon
                  size={20}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </AnimatedContent>
          </div>
        </div>
        <div className="space-y-6 p-4 pt-16 md:p-16">
          {landingFeatures.map((feature, index) => (
            <AnimatedContent
              key={index}
              delay={index * 0.08}
              className="w-full md:sticky md:top-[6.5rem]"
            >
              <div
                className={`${feature.cardBg ?? "bg-muted"} group flex w-full flex-col items-start rounded-xl border border-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_16px_40px_-16px_rgb(8_87_254/0.4)]`}
              >
                <div
                  className={`${feature.iconBg ?? "bg-brand"} rounded-md p-2 text-brand-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                >
                  <feature.icon size={24} />
                </div>
                <p className="mt-4 text-base font-medium">{feature.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
