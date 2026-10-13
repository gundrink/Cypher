"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useWallet } from "@/hooks/useWallet";
import { getUsername } from "@/lib/blockchain";
import { ROUTES } from "@/lib/constants/routes";
import { hasSession, saveSession } from "@/lib/utils/session";

export function useLogin() {
  const router = useRouter();
  const { ready, authenticated, address } = useWallet();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !authenticated || !address) return;

    let cancelled = false;

    async function routeConnectedWallet() {
      if (!address) return;
      try {
        if (hasSession()) {
          const keysData = localStorage.getItem("cypher_keys");
          router.push(keysData ? ROUTES.DASHBOARD : ROUTES.RECOVER);
          return;
        }

        const username = await getUsername(null, address);
        if (cancelled) return;
        if (username) {
          saveSession(
            address,
            username.startsWith("@") ? username : `@${username}`
          );
          const keysData = localStorage.getItem("cypher_keys");
          router.push(keysData ? ROUTES.DASHBOARD : ROUTES.RECOVER);
          return;
        }
        router.push(ROUTES.ONBOARDING);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not open your wallet"
        );
      }
    }

    void routeConnectedWallet();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, address, router]);

  return {
    error,
    shouldRender: ready && (!authenticated || Boolean(error)),
    ready,
  };
}
