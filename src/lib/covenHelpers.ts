// ═══════════════════════════════════════════════════════════════════════════
// Coven Helper Functions - Runtime Safe Version
// Uses type assertions to bypass TypeScript client issues
// ═══════════════════════════════════════════════════════════════════════════

import { supabase as supabaseClient } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
const supabase = supabaseClient as any;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileSize?: number;
  mimeType?: string;
}

export function validateFile(file: File): FileValidationResult {
  const mimeType = file.type;
  const fileSize = file.size;

  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    if (fileSize > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `Image size exceeds 10MB limit (${(fileSize / 1024 / 1024).toFixed(2)}MB)`,
      };
    }
    return { valid: true, fileSize, mimeType };
  }

  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    if (fileSize > MAX_VIDEO_SIZE) {
      return {
        valid:  false,
        error: `Video size exceeds 50MB limit (${(fileSize / 1024 / 1024).toFixed(2)}MB)`,
      };
    }
    return { valid: true, fileSize, mimeType };
  }

  return {
    valid: false,
    error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV) are allowed.',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE TOKEN GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export async function generateSecureInviteCode(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_secure_invite_code');
    
    if (error || !data) {
      console.warn('[generateSecureInviteCode] DB function failed, using crypto fallback:', error);
      return crypto.randomUUID().substring(0, 8).toUpperCase().replace(/-/g, '');
    }
    
    return data;
  } catch (err) {
    console.warn('[generateSecureInviteCode] Exception, using crypto fallback:', err);
    return crypto.randomUUID().substring(0, 8).toUpperCase().replace(/-/g, '');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COVEN CREATION
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateCovenParams {
  name: string;
  description?: string;
  subculture?: string;
  sigil?: string;
  isPrivate?: boolean;
  userId: string;
}

export async function createCoven(params: CreateCovenParams) {
  const { name, description, subculture, sigil, isPrivate = true, userId } = params;

  if (!name.trim()) {
    throw new Error('Coven name is required');
  }

  const inviteToken = await generateSecureInviteCode();

  // Create coven
  const { data: coven, error: covenError } = await (supabase as any)
    .from('covens')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      subculture: subculture?.trim() || null,
      sigil: sigil || null,
      is_private: isPrivate,
      created_by: userId,
      invite_code: inviteToken,
    })
    .select()
    .single();

  if (covenError) {
    console.error('[createCoven] Error creating coven:', covenError);
    throw new Error(covenError.message);
  }

  // Add creator as admin (ONLY VALID ROLE for creators)
  const { error: memberError } = await (supabase as any)
    .from('coven_members')
    .insert({
      coven_id: coven.id,
      user_id: userId,
      role: 'admin',
    });

  if (memberError) {
    console.error('[createCoven] Error adding creator as admin:', memberError);
    await (supabase as any).from('covens').delete().eq('id', coven.id);
    throw new Error('Failed to set up coven membership');
  }

  // Create invite token record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: tokenError } = await (supabase as any)
    .from('coven_invite_tokens')
    .insert({
      coven_id: coven.id,
      token_code: inviteToken,
      role: 'member',
      created_by: userId,
      expires_at: expiresAt.toISOString(),
      is_valid: true,
    });

  if (tokenError) {
    console.error('[createCoven] Error creating invite token:', tokenError);
  }

  return coven;
}

// ═══════════════════════════════════════════════════════════════════════════
// JOIN COVEN BY INVITE CODE
// ═══════════════════════════════════════════════════════════════════════════

export async function joinCovenByInviteCode(inviteCode: string, userId: string) {
  const { data: token, error: tokenError } = await (supabase as any)
    .from('coven_invite_tokens')
    .select('*, covens(*)')
    .eq('token_code', inviteCode.toUpperCase())
    .eq('is_valid', true)
    .maybeSingle();

  if (tokenError) {
    console.error('[joinCovenByInviteCode] Error fetching token:', tokenError);
    throw new Error('Failed to validate invite code');
  }

  if (!token) {
    throw new Error('Invalid invite code');
  }

  if (new Date(token.expires_at) < new Date()) {
    throw new Error('Invite code has expired');
  }

  // Check if already a member
  const { data: existingMember } = await (supabase as any)
    .from('coven_members')
    .select('id')
    .eq('coven_id', token.coven_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    throw new Error('You are already a member of this coven');
  }

  // Add member
  const { error: memberError } = await (supabase as any)
    .from('coven_members')
    .insert({
      coven_id: token.coven_id,
      user_id: userId,
      role: token.role,
    });

  if (memberError) {
    console.error('[joinCovenByInviteCode] Error adding member:', memberError);
    throw new Error(memberError.message);
  }

  return token.coven_id;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD COVEN IMAGE
// ═══════════════════════════════════════════════════════════════════════════

export async function uploadCovenImage(
  file: File,
  covenId: string,
  type: 'avatar' | 'header'
): Promise<string> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${covenId}-${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('coven-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[uploadCovenImage] Upload error:', uploadError);
    throw new Error('Failed to upload image');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('coven-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCE UTILITY
// ═══════════════════════════════════════════════════════════════════════════

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION CHECKS
// ═══════════════════════════════════════════════════════════════════════════

export async function getUserCovenRole(
  covenId: string,
  userId: string
): Promise<'admin' | 'member' | null> {
  const { data, error } = await (supabase as any)
    .from('coven_members')
    .select('role')
    .eq('coven_id', covenId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getUserCovenRole] Error:', error);
    return null;
  }

  return data?.role || null;
}

export async function canAccessCoven(
  covenId: string,
  userId: string
): Promise<{ canAccess: boolean; role: 'admin' | 'moderator' | 'member' | 'pending' | null }> {
  // Get coven details to check if private
  const { data: coven, error: covenError } = await (supabase as any)
    .from('covens')
    .select('is_private')
    .eq('id', covenId)
    .maybeSingle();

  if (covenError || !coven) {
    console.error('[canAccessCoven] Error fetching coven:', covenError);
    return { canAccess: false, role: null };
  }

  // Get user's role in the coven
  const userRole = await getUserCovenRole(covenId, userId);

  // If user is a member (any role), they can access
  if (userRole) {
    return { canAccess: true, role: userRole };
  }

  // If coven is public, anyone can access
  if (!coven.is_private) {
    return { canAccess: true, role: null };
  }

  // If coven is private and user is not a member, deny access
  return { canAccess: false, role: null };
}

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('[isUserSuperAdmin] Error:', error);
    return false;
  }

  return !!data;
}

export function canModerate(role: string | null): boolean {
  return role === 'admin' || role === 'moderator';
}

export function canAdminister(role: string | null): boolean {
  return role === 'admin';
}
