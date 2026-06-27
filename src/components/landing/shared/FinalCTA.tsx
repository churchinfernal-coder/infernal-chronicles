// 
// FINAL CTA SECTION - Conversion Focused
// 

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCTATracking } from '@/hooks/landing/useLandingPage';

export default function FinalCTA() {
  const { trackClick } = useCTATracking();

  const handleClick = () => {
    trackClick('final_cta', 'https://infernalsocial.com');
    window.open('https://infernalsocial.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-black to-red-950/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-gothic font-bold text-white">
            Join the Infernal Movement
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Become part of the global I.C.O.S community at infernalsocial.com
          </p>
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8 md:px-12 py-5 md:py-6 text-lg md:text-xl font-gothic shadow-2xl shadow-red-900/50 transition-all hover:shadow-red-900/70 hover:scale-105"
            onClick={handleClick}
            data-cta="final"
          >
            <Flame className="w-5 h-5 md:w-6 md:h-6 mr-3" />
            Join Now
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
