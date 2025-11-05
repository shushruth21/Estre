-- Delete existing user roles for admin and staff accounts
DELETE FROM public.user_roles 
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
);

-- Note: To delete the actual user accounts:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find the users with emails: admin@estre.in and staff@estre.in
-- 3. Click the three dots menu next to each user
-- 4. Select "Delete user" for both accounts