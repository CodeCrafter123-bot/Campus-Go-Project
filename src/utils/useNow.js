import { useEffect, useState } from "react";

// Returns the current Date and refreshes it every `intervalMs`
// so open/closed badges and delivery slots stay live.

//gives the current time and refresh it every 30 sec 
export default function useNow(intervalMs = 30000) {
  //hold a date object with the current date 
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    //refresh the time with a timer every 30 sec 
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer); // cleanup when the screen unmounts
  }, [intervalMs]);

  return now;
}
