// 
// ABOUT SECTION - Unique Content per Location
// 

import { motion } from 'framer-motion';
import { BookOpen, Users, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AboutSectionProps {
  aboutTitle: string;
  aboutContent: string;
  feature1Title?: string;
  feature1Description?: string;
  feature2Title?: string;
  feature2Description?: string;
  feature3Title?: string;
  feature3Description?: string;
  locationName: string;
}

export default function AboutSection({
  aboutTitle,
  aboutContent,
  feature1Title,
  feature1Description,
  feature2Title,
  feature2Description,
  feature3Title,
  feature3Description,
  locationName,
}: AboutSectionProps) {
  const features = [
    {
      icon: BookOpen,
      title: feature1Title || 'Infernal Bible',
      description: feature1Description || 'Access the sacred texts and teachings of infernalism',
    },
    {
      icon: Users,
      title: feature2Title || 'Infernalist Community',
      description: feature2Description || `Connect with fellow infernalists in ${locationName}`,
    },
    {
      icon: Flame,
      title: feature3Title || 'Path of Satan',
      description: feature3Description || 'Explore the philosophy and practices of I.C.O.S',
    },
  ];

  return (
    <section id="about" className="py-12 md:py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 md:space-y-6 mb-12 md:mb-16"
          >
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-gothic font-bold text-white">
              {aboutTitle}
            </h2>
            <div className="w-20 h-1 bg-red-600 mx-auto" />
            <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              {aboutContent}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/50 border-red-900/30 p-4 md:p-6 hover:border-red-600/50 transition-all h-full">
                  <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-red-500 mb-3 md:mb-4" />
                  <h3 className="text-lg md:text-xl font-gothic font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
