// 
// SUB-LOCATIONS SECTION - States/Cities Navigation
// 

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { State, City } from '@/types/landing';

interface SubLocationsProps {
  locations: Array<State | City>;
  countrySlug: string;
  stateSlug?: string;
  locationType: 'states' | 'cities';
}

export default function SubLocations({
  locations,
  countrySlug,
  stateSlug,
  locationType,
}: SubLocationsProps) {
  if (locations.length === 0) return null;

  const title = locationType === 'states' ? 'Explore States' : 'Explore Cities';

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl lg:text-4xl font-gothic font-bold text-white text-center mb-8 md:mb-12"
          >
            {title}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {locations.map((location, index) => {
              const isState = 'state_code' in location;
              const linkPath = isState
                ? `/landing/${countrySlug}/${location.slug}`
                : `/landing/${countrySlug}/${stateSlug}/${location.slug}`;

              return (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link to={linkPath} className="block group">
                    <Card className="bg-black/50 border-red-900/30 p-3 md:p-4 hover:border-red-600 hover:shadow-lg hover:shadow-red-900/20 transition-all group-hover:scale-105 h-full">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
                        <span className="text-white font-medium text-sm md:text-base flex-grow">
                          {location.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
