// 
// HERO SECTION - Above the Fold
// Mobile-First, Performance Optimized
// 

import { motion } from 'framer-motion';
import { MapPin, Flame, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCTATracking } from '@/hooks/landing/useLandingPage';

interface HeroSectionProps {
  h1Title: string;
  h2Subtitle: string;
  heroDescription: string;
  locationName: string;
  ctaPrimaryText: string;
  ctaSecondaryText?: string;
}

export default function HeroSection({
  h1Title,
  h2Subtitle,
  heroDescription,
  locationName,
  ctaPrimaryText,
  ctaSecondaryText,
}: HeroSectionProps) {
  const { trackClick } = useCTATracking();

  const handlePrimaryCTA = () => {
    trackClick('primary_cta', 'https://infernalsocial.com');
    window.open('https://infernalsocial.com', '_blank', 'noopener,noreferrer');
  };

  const handleSecondaryCTA = () => {
    trackClick('secondary_cta', '#about');
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden border-b border-red-900/30 py-12 md:py-20 lg:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_50%)]" />
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l30 30-30 30L0 30z\' fill=\'%23dc2626\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Location Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-red-900/20 rounded-full flex items-center justify-center border-2 border-red-600">
              <MapPin className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
            </div>
          </motion.div>

          {/* I.C.O.S Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 md:space-x-3 text-red-500 font-gothic text-2xl md:text-3xl lg:text-5xl"
          >
            <Flame className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12" />
            <span>I.C.O.S</span>
            <Flame className="w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12" />
          </motion.div>

          {/* H1 Title (Unique per location) */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-5xl lg:text-7xl font-gothic font-bold text-white leading-tight"
          >
            {h1Title}
          </motion.h1>

          {/* H2 Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-3xl mx-auto"
          >
            {h2Subtitle}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {heroDescription}
          </motion.p>

          {/* Keywords */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm text-gray-400"
          >
            <span className="px-3 py-1 bg-red-900/20 border border-red-800/30 rounded-full">
              Infernalism
            </span>
            <span className="px-3 py-1 bg-red-900/20 border border-red-800/30 rounded-full">
              Infernal Bible
            </span>
            <span className="px-3 py-1 bg-red-900/20 border border-red-800/30 rounded-full">
              Infernalist Community
            </span>
            <span className="px-3 py-1 bg-red-900/20 border border-red-800/30 rounded-full">
              Satan
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-gothic shadow-lg shadow-red-900/50 transition-all hover:shadow-xl hover:shadow-red-900/70"
              onClick={handlePrimaryCTA}
              data-cta="primary"
            >
              <Users className="w-5 h-5 mr-2" />
              {ctaPrimaryText}
            </Button>
            {ctaSecondaryText && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-red-600 text-red-500 hover:bg-red-900/20 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-gothic transition-all"
                onClick={handleSecondaryCTA}
                data-cta="secondary"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                {ctaSecondaryText || 'Learn About Infernalism'}
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
