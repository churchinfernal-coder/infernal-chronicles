# Mobile-First Responsive Design Implementation Guide

## Overview
This document outlines the responsive design strategy for Infernal Chronicles, implementing a **mobile-first approach** with hard production gates.

## Viewport Breakpoints (Mobile First)

```
320px   → Base (iPhone SE, small phones)
640px   → sm (Tablet portrait, larger phones)
768px   → md (Tablet landscape)
1024px  → lg (Laptop, desktop)
1440px  → xl (Large desktop)
2560px  → 2xl (Ultra-wide displays)
```

## Core Principles

### 1. Mobile First
- **Default styles**: Designed for 320px
- **Progressive enhancement**: Add styles at wider breakpoints
- **Mobile-optimized**: Touch targets 44px minimum
- **No horizontal scroll**: Max-width: 100vw

### 2. Typography Scaling
```
Mobile (320px)        Tablet (768px)        Desktop (1024px)
-----------           ----------           -----------
h1: 28px              h1: 36px              h1: 40px
h2: 24px              h2: 32px              h2: 36px
h3: 20px              h3: 28px              h3: 32px
p: 16px (base)        p: 16px               p: 16px
```

### 3. Spacing System
```
Mobile:    1rem (16px) baseline
Tablet:    1.5rem (24px) baseline
Desktop:   2rem (32px) baseline
Wide:      Maintain max-width containers
```

### 4. Touch & Interaction
- Minimum button size: 44x44px (W3C WCAG standard)
- Form inputs: 16px+ font size (prevents iOS zoom)
- Clickable area: Min 10px padding
- Space between interactive elements: Min 8px

## Component Responsive Guidelines

### Navigation
```
Mobile:   Stack vertically, hamburger menu
Tablet:   Horizontal, room for 4-5 items
Desktop:  Full horizontal, logo + items + extras
```

### Cards/Grid
```
Mobile:   1 column, full width
Tablet:   2 columns, 16px gap
Desktop:  3-4 columns, 24-32px gap
```

### Forms
```
Mobile:   Full-width inputs, stacked labels
Tablet:   Inline labels, still flexible
Desktop:  Multi-column, labels on left (optional)
```

### Images
```
Mobile:   100% width, preserve aspect ratio
Tablet:   Constrained width, larger aspect
Desktop:  Max-width containers, optimized DPI
```

## Hard Gate Requirements

### 1. Viewport Support
- ✓ 320px (iPhone SE)
- ✓ 768px (iPad portrait)
- ✓ 1024px (iPad landscape, laptop)
- ✓ 1440px (desktop)
- ✓ 2560px (ultra-wide)

### 2. Touch Targets
```javascript
// Minimum 44px on mobile
button, a, input { min-height: 44px; min-width: 44px; }
```

### 3. Cumulative Layout Shift (CLS)
- **Target**: < 0.1
- **Method**: Reserve space for dynamic content
- **Avoid**: Ads, embeds that load late
- **Test**: Use Lighthouse in Chrome DevTools

### 4. Lighthouse Score
```
Target: > 85 across all metrics
- Performance: > 85
- Accessibility: > 85
- Best Practices: > 85
- SEO: > 85
```

### 5. No Horizontal Scroll
```javascript
// Enforce maximum viewport width
body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

## Testing Strategy

### Browser Testing
```
Mobile:
- iPhone SE (320px)
- iPhone 12 (390px)
- Android (370-412px)

Tablet:
- iPad mini (768px)
- iPad (1024px)

Desktop:
- Laptop (1440px)
- Large monitor (2560px)
```

### Tools
```bash
# Lighthouse CLI
npm run lighthouse

# Responsive testing
Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)

# Performance
npm run test:gate:responsive
```

## Implementation Checklist

- [ ] Mobile-first CSS implemented
- [ ] All components use responsive classes
- [ ] Touch targets 44px+ on mobile
- [ ] No horizontal scroll at any viewport
- [ ] Images responsive and optimized
- [ ] Forms work on all devices
- [ ] Typography scales with viewport
- [ ] Navigation responsive at all sizes
- [ ] CLS < 0.1 (no layout shifts)
- [ ] Lighthouse > 85 all categories
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Performance P95 < 200ms

## File Structure

```
src/styles/
├── mobile-first.css          ← Core responsive styles
├── components/
│   ├── *.tsx                 ← All use Tailwind responsive classes
│   └── ...
└── ...
```

## Common Tailwind Patterns

```jsx
{/* Mobile first responsive grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* Single column on mobile, 4 on desktop */}
</div>

{/* Responsive typography */}
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  {/* 28px on mobile, 48px on desktop */}
</h1>

{/* Responsive padding */}
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  {/* 16px on mobile, 48px on desktop */}
</div>

{/* Hidden on mobile */}
<div className="hidden md:block">
  {/* Only visible on tablet and desktop */}
</div>
```

## Performance Metrics

### Target Performance
```
Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
```

### Optimization
1. **Images**: Use next-gen formats (WebP)
2. **Fonts**: Limit to 2-3 typefaces
3. **CSS**: Minimal unused styles
4. **JS**: Code split by route
5. **Lazy loading**: Images and components

## Accessibility Requirements

- [ ] WCAG 2.1 Level AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast 4.5:1 for text
- [ ] Focus indicators visible
- [ ] Motion reduced option respected

Ready for: `npm run test:gate:responsive`
