'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Users,
  Wind,
  MessageCircle,
  Clock,
  Wand2,
  Dice5,
  Wand,
  Cog,
  BookMarked,
  Home,
  Menu,
  X,
} from 'lucide-react';
import './Sidebar.module.css';

interface MenuItemConfig {
  id:  string;
  label: string;
  icon: React.ReactNode;
  path: string;
  category: 'main' | 'premium';
}

// Menu configuration - easily extensible
const MENU_CONFIG: MenuItemConfig[] = [
  // MAIN MENU
  { id: 'diary', label: "Devil's Diary", icon: <BookOpen size={20} />, path:  '/feed', category: 'main' }, // ← FIXED:  changed from /diary to /feed
  { id:  'synagogue', label: "Satan's Synagogue", icon:  <Building2 size={20} />, path: '/satans-sinagogue', category: 'main' }, // ← FIXED: changed from /synagogue
  { id: 'palace', label: 'Picture Palace', icon: <Cog size={20} />, path: '/picture-palace', category: 'main' }, // ← FIXED:  changed from /palace
  { id: 'allies', label: 'Allies', icon: <Users size={20} />, path:  '/friends', category: 'main' }, // ← FIXED: changed from /allies to /friends
  { id: 'covens', label: 'Covens', icon: <Wind size={20} />, path:  '/covens', category: 'main' },
  { id: 'chat', label: 'Infernal Chat', icon: <MessageCircle size={20} />, path:  '/chat', category: 'main' },

  // PREMIUM SERVICES
  { id: 'ouija', label: 'Ouija Chamber', icon: <Clock size={20} />, path: '/ouija-room', category: 'premium' }, // ← FIXED: changed from /ouija
  { id: 'tarot', label: 'Tarot Chamber', icon: <Dice5 size={20} />, path:  '/tarot', category: 'premium' }, // ← FIXED: label changed, path stays /tarot
  { id:  'rune', label: 'Rune Casting', icon: <Wand2 size={20} />, path: '/rune-casting', category: 'premium' }, // ← FIXED: changed from /rune
  { id: 'solomon', label: "Solomon's Chamber", icon: <Wand size={20} />, path: '/solomons-chamber', category: 'premium' }, // ← FIXED: changed from /solomon
  { id: 'ritual', label: 'Ritual Calendar', icon: <Clock size={20} />, path: '/ritual-calendar', category: 'premium' }, // ← FIXED: changed from /ritual
  { id:  'library', label: 'Occult Library', icon: <BookMarked size={20} />, path: '/occult-library', category: 'premium' }, // ← FIXED: changed from /library
  { id: 'works', label:  'Wicked Works', icon: <Wand size={20} />, path: '/wicked-works', category: 'premium' }, // ← FIXED:  changed from /works
  // ← REMOVED: Prime Store
];

interface SidebarProps {
  onNavigate?:  (path: string) => void;
}

export const Sidebar:  React.FC<SidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Memoize menu items by category
  const menuItemsByCategory = useMemo(() => ({
    main: MENU_CONFIG.filter(item => item. category === 'main'),
    premium: MENU_CONFIG.filter(item => item.category === 'premium')
  }), []);

  // Handle navigation with optional callback
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    onNavigate?.(path);
    
    // Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  }, [navigate, onNavigate]);

  // Check if menu item is currently active
  const isMenuItemActive = useCallback((path: string): boolean => {
    return location. pathname === path || location.pathname. startsWith(path + '/');
  }, [location.pathname]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate(path);
    }
  }, [handleNavigate]);

  const MenuItemComponent = React.memo<{ item: MenuItemConfig }>(({ item }) => (
    <button
      key={item.id}
      className={`sidebar-menu-item ${isMenuItemActive(item.path) ? 'active' : ''} ${item.category === 'premium' ? 'premium' : ''}`}
      onClick={() => handleNavigate(item. path)}
      onKeyDown={(e) => handleKeyDown(e, item.path)}
      role="menuitem"
      aria-current={isMenuItemActive(item.path) ? 'page' : undefined}
      title={item.label}
      data-testid={`menu-item-${item.id}`}
    >
      <span className="sidebar-icon" aria-hidden="true">
        {item.icon}
      </span>
      {isExpanded && <span className="sidebar-label">{item.label}</span>}
    </button>
  ));

  MenuItemComponent.displayName = 'MenuItem';

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar menu"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header Section */}
        <div className="sidebar-header">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label="Toggle sidebar expansion"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Home size={24} />
          </button>
          <h1 className="sidebar-title">infernal</h1>
          {isExpanded && <span className="sidebar-subtitle">View Castle</span>}
        </div>

        {/* Main Menu Section */}
        <nav className="sidebar-nav-section" aria-label="Main menu">
          {menuItemsByCategory.main.map(item => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </nav>

        {/* Premium Services Divider & Section */}
        {menuItemsByCategory. premium.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">
              {isExpanded && 'PREMIUM SERVICES'}
            </div>

            <nav className="sidebar-nav-section premium" aria-label="Premium services">
              {menuItemsByCategory.premium.map(item => (
                <MenuItemComponent key={item.id} item={item} />
              ))}
            </nav>
          </>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          {isExpanded && <span className="sidebar-footer-text">Infernal Chronicles</span>}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;