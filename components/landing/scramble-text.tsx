"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "framer-motion";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@*";
const FRAME_MS = 40;

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export default function ScrambleText({
  text,
  className = "",
  delay = 400,
  duration = 1200,
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (reduceMotion) return;

    const totalFrames = Math.max(1, Math.round(duration / FRAME_MS));
    let frame = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        frame += 1;
        const revealed = Math.floor((frame / totalFrames) * text.length);
        setOutput(
          Array.from(text, (char, index) =>
            char === " " || index < revealed
              ? char
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          ).join("")
        );
        if (frame >= totalFrames) {
          clearInterval(intervalId);
          setOutput(text);
        }
      }, FRAME_MS);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, duration, reduceMotion]);

  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span aria-hidden="true" className={`absolute inset-0 ${className}`}>
        {output}
      </span>
    </span>
  );
}
