// 
// LOADING COMPONENT - Landing Pages
// Themed loading state
// 

import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingLoadingProps {
  message?: string;
}

export default function LandingLoading({ message = 'Loading the darkness...' }: LandingLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-block"
        >
          <Flame className="w-16 h-16 text-red-600" />
        </motion.div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-xl font-gothic text-red-500"
        >
          {message}
        </motion.p>

        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
