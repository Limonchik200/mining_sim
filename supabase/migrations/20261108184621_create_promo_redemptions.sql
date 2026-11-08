/*
# Create promo_redemptions (one redemption per account per code)

1. New Tables
- `promo_redemptions`
  - `user_id` (uuid, not null, defaults to the signed-in user, references auth.users)
  - `code` (text, not null, the promo code in lowercase)
  - `redeemed_at` (timestamptz, default now())
  - Primary key (user_id, code) so the same account cannot redeem the same code twice.

2. Security
- Enable RLS on `promo_redemptions`.
- Grant SELECT and INSERT to `authenticated` only. No UPDATE or DELETE is granted, so redemptions cannot be altered or removed by clients.
- Policies: a signed-in user can read and insert only rows whose user_id is their own.

3. Important Notes
- A duplicate insert fails with unique violation 23505, which the app reads as "code already used".
*/

CREATE TABLE IF NOT EXISTS promo_redemptions (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);

ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON promo_redemptions TO authenticated;

DROP POLICY IF EXISTS "select_own_promo_redemptions" ON promo_redemptions;
CREATE POLICY "select_own_promo_redemptions" ON promo_redemptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_promo_redemptions" ON promo_redemptions;
CREATE POLICY "insert_own_promo_redemptions" ON promo_redemptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
