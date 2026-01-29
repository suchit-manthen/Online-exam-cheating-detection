import { useEffect, useState } from "react";

function Timer({ duration }) {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <h4>Time Left: {time}s</h4>;
}

export default Timer;
