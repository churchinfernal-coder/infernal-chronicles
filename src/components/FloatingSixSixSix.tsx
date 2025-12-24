import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingNumber {
  id: string;
  x: number;
  y: number;
  delay: number;
}

export const FloatingSixSixSix = ({ trigger }: { trigger: boolean }) => {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

  useEffect(() => {
    if (trigger) {
      const newNumbers: FloatingNumber[] = Array.from({ length: 6 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: i * 0.1,
      }));
      setNumbers(newNumbers);

      const timer = setTimeout(() => setNumbers([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {numbers.map((num) => (
          <motion.div
            key={num.id}
            initial={{
              opacity: 0,
              x: `calc(50% + ${num.x}px)`,
              y: "50%",
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: ["50%", "20%", "10%", "-10%"],
              scale: [0, 1.5, 1.2, 0.8],
              rotate: [0, 360],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 2.5,
              delay: num.delay,
              ease: "easeOut",
            }}
            className="absolute text-6xl font-bold"
            style={{
              textShadow: "0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(220, 38, 38, 0.4)",
              color: "#dc2626",
              filter: "drop-shadow(0 0 10px #dc2626)",
            }}
          >
            666
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
