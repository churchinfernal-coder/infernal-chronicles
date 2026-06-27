// 
// BREADCRUMB COMPONENT - Navigation & SEO
// 

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { Country, State, City } from '@/types/landing';

interface BreadcrumbProps {
  country: Country;
  state?: State;
  city?: City;
}

export default function Breadcrumb({ country, state, city }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center space-x-2 text-sm text-gray-400 mb-8"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="hover:text-red-500 transition-colors flex items-center"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      <ChevronRight className="w-4 h-4" />

      <Link
        to={`/landing/${country.slug}`}
        className={`hover:text-red-500 transition-colors ${
          !state && !city ? 'text-red-500 font-medium' : ''
        }`}
      >
        {country.name}
      </Link>

      {state && (
        <>
          <ChevronRight className="w-4 h-4" />
          <Link
            to={`/landing/${country.slug}/${state.slug}`}
            className={`hover:text-red-500 transition-colors ${
              !city ? 'text-red-500 font-medium' : ''
            }`}
          >
            {state.name}
          </Link>
        </>
      )}

      {city && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-red-500 font-medium">{city.name}</span>
        </>
      )}
    </nav>
  );
}
