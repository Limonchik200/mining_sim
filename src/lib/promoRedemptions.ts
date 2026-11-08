import { supabase } from '@/lib/supabase';

export type PromoClaimResult = 'claimed' | 'already_used' | 'failed';

const UNIQUE_VIOLATION = '23505';

export async function claimPromoCode(code: string): Promise<PromoClaimResult> {
  const { error } = await supabase.from('promo_redemptions').insert({ code });
  if (!error) return 'claimed';
  if (error.code === UNIQUE_VIOLATION) return 'already_used';
  return 'failed';
}
