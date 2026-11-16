import { useEffect, useState } from "react";

// Returns the current Date and refreshes it every `intervalMs`
// so open/closed badges and delivery slots stay live.
export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer); // cleanup when the screen unmounts
  }, [intervalMs]);

  return now;
}
