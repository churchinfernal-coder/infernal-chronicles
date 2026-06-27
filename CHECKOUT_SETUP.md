# Checkout System Setup Guide

## 🎯 Overview

Complete Stripe-integrated checkout system for Infernal Chronicles with:
- Product management
- Order tracking
- Payment processing
- Invoice generation
- Discount codes
- User features/access management

## 📋 SQL Migrations

Run these migrations in your Supabase dashboard:

### 1. Main Tables Migration
File: `supabase/migrations/20250101_create_checkout_tables.sql`

**Creates:**
- `products` - Product catalog
- `orders` - Payment orders
- `payment_methods` - Saved cards
- `invoices` - Invoice records
- `user_subscriptions` - Recurring subscriptions
- `payment_history` - Audit trail

### 2. Checkout Enhancements
File: `supabase/migrations/20250102_checkout_enhancements.sql`

**Creates:**
- `checkout_sessions` - Active checkout sessions
- `discount_codes` - Coupon codes
- Helper functions for code validation and price calculation

### 3. Feature Integration
File: `supabase/migrations/20250103_integrate_with_dungeon_albums.sql`

**Creates:**
- `user_features` - Track granted features
- Functions to check user access
- Links orders to albums if applicable

## 🔧 Environment Setup

Add to your `.env.local`:
