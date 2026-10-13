"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";

export function useVerify() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.LOGIN);
  }, [router]);

  return {
    otp: "",
    setOtp: (_value: string) => {},
    error: "",
    loginMethod: "email" as const,
    contactValue: "",
    state: { status: "initial" as "initial" | "submitting-code" },
    handleSubmit: () => {},
    handleResendOTP: async () => {},
  };
}
