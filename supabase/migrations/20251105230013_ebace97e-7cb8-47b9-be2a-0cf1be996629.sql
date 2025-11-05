-- Create admin user
-- Note: Password will be 'admin@123'
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@estre.in',
  crypt('admin@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
);

-- Create staff user  
-- Note: Password will be 'staff@123'
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'staff@estre.in',
  crypt('staff@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
);

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a0000000-0000-0000-0000-000000000001'::uuid, 'admin');

-- Assign factory_staff role
INSERT INTO public.user_roles (user_id, role)
VALUES ('b0000000-0000-0000-0000-000000000001'::uuid, 'factory_staff');