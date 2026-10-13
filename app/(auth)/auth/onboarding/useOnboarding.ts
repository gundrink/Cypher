import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { useUsername } from "@/hooks/useUsername";
import { useWallet } from "@/hooks/useWallet";
import { getUsername, registerUsername } from "@/lib/blockchain";
import { deriveMetaKeys } from "@/lib/blockchain/meta-keys";
import { ROUTES } from "@/lib/constants/routes";
import { hashPIN, storePINHash } from "@/lib/utils/pin";
import { hasSession, saveSession } from "@/lib/utils/session";
import { getOrCreateWalletSignature } from "@/lib/utils/wallet-signature";

type OnboardingStep = "username" | "pin" | "signing" | "registering";

export function useOnboarding() {
  const router = useRouter();
  const { checkAvailability, isChecking, availability } = useUsername();
  const {
    sender,
    isConnected,
    address,
    walletAddress,
    authenticated,
    ready,
    isLoading: isWalletLoading,
  } = useWallet();

  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    const claimed = sessionStorage.getItem("cypher_claim_username") ?? "";
    if (claimed) sessionStorage.removeItem("cypher_claim_username");
    return claimed;
  });
  const [step, setStep] = useState<OnboardingStep>("username");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  const validateUsername = useCallback((value: string): boolean => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError("Please enter a username");
      return false;
    }

    const usernameWithoutAt = trimmedValue.replace(/^@+/, "");

    if (usernameWithoutAt.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameWithoutAt)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }

    setError("");
    return true;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      value = value.replace(/^@+/, "");
      setUsername(value);
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleUsernameSubmit = useCallback(
    async (e?: React.FormEvent | React.MouseEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!validateUsername(username)) {
        return;
      }

      const cleanUsername = username.replace(/^@+/, "");

      if (availability === false) {
        setError("Username is already taken");
        return;
      }

      if (availability === null && !isChecking) {
        const isAvailable = await checkAvailability(cleanUsername);
        if (!isAvailable) {
          setError("Username is already taken");
          return;
        }
      }

      if (availability === true) {
        setStep("pin");
        setError("");
      }
    },
    [username, validateUsername, availability, isChecking, checkAvailability]
  );

  const handlePINComplete = useCallback(
    async (enteredPin: string) => {
      setStep("signing");
      setError("");

      try {
        if (!sender || !address) {
          throw new Error("Please connect your wallet first");
        }

        const walletAddr = address;
        const walletSignature = await getOrCreateWalletSignature(
          sender.signMessage,
          walletAddr
        );

        setStep("registering");
        setIsLoading(true);

        const metaKeys = await deriveMetaKeys(
          walletAddr,
          walletSignature,
          enteredPin
        );

        const cleanUsername = username.replace(/^@+/, "");
        await registerUsername(sender, cleanUsername, metaKeys.metaViewPub);

        storePINHash(hashPIN(enteredPin), walletAddr);

        localStorage.setItem(
          "cypher_keys",
          JSON.stringify({
            viewingKey: metaKeys.metaViewPub,
            viewingKeyPrivate: metaKeys.metaViewPriv,
            spendingKey: metaKeys.metaSpendPub,
            spendingKeyPrivate: metaKeys.metaSpendPriv,
          })
        );

        localStorage.setItem("cypher_username", `@${cleanUsername}`);

        saveSession(walletAddr, `@${cleanUsername}`);

        router.push(ROUTES.DASHBOARD);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("user rejected")) {
            setError("Transaction cancelled");
          } else if (err.message.includes("connect your wallet")) {
            setError("Wallet not connected. Please try logging in again.");
          } else if (err.message.includes("Rate limit")) {
            setError("Too many requests. Please try again later.");
          } else {
            setError(err.message || "Something went wrong. Please try again.");
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
        setStep("pin");
      } finally {
        setIsLoading(false);
      }
    },
    [sender, address, username, router]
  );

  const handleBack = useCallback(() => {
    if (step === "pin") {
      setStep("username");
      setError("");
    } else if (step === "signing" || step === "registering") {
      setStep("pin");
      setError("");
    } else {
      router.back();
    }
  }, [step, router]);

  useEffect(() => {
    async function checkUserRegistration() {
      if (!ready) {
        return;
      }

      if (hasSession()) {
        router.push(ROUTES.DASHBOARD);
        return;
      }

      if (!authenticated || !address) {
        setIsCheckingRegistration(false);
        return;
      }

      try {
        const registeredUsername = await getUsername(null, address);
        if (registeredUsername && registeredUsername.length > 0) {
          saveSession(address, `@${registeredUsername}`);

          const keysData = localStorage.getItem("cypher_keys");
          if (!keysData) {
            router.push(ROUTES.RECOVER);
            return;
          }

          router.push(ROUTES.DASHBOARD);
          return;
        }
      } catch {
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkUserRegistration();
  }, [ready, authenticated, address, router]);

  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const cleanUsername = username.replace(/^@+/, "");
      if (cleanUsername.length >= 3) {
        checkAvailability(cleanUsername);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkAvailability]);

  return {
    username,
    step,
    error,
    isLoading,
    isCheckingRegistration,
    isChecking,
    availability,
    isWalletLoading,
    isConnected,
    hasWalletAddress: Boolean(address || walletAddress),
    validateUsername,
    handleInputChange,
    handleUsernameSubmit,
    handlePINComplete,
    handleBack,
    setError,
  };
}
