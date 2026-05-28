"use client";

import { useEffect, useState } from "react";

export function useTypewriter(text: string, active: boolean, msPerChar = 12) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active || !text) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, msPerChar);

    return () => clearInterval(id);
  }, [text, active, msPerChar]);

  return displayed;
}
