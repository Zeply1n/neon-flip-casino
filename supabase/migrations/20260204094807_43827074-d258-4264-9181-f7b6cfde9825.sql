-- Add account_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'standard';

-- Update the handle_new_user function to include account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _server_seed TEXT;
  _server_seed_hash TEXT;
  _username TEXT;
BEGIN
  -- Generate server seed
  _server_seed := encode(gen_random_bytes(32), 'hex');
  _server_seed_hash := encode(sha256(_server_seed::bytea), 'hex');
  
  -- Get username from metadata or email
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Create profile with username
  INSERT INTO public.profiles (user_id, username, account_type)
  VALUES (NEW.id, _username, 'standard');
  
  -- Create user role (default: user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create provably fair seeds
  INSERT INTO public.provably_fair_seeds (user_id, server_seed, server_seed_hash)
  VALUES (NEW.id, _server_seed, _server_seed_hash);
  
  -- Give new user 1000 F$ starting balance
  INSERT INTO public.ledger_entries (user_id, type, amount, ref_id, description)
  VALUES (NEW.id, 'DEPOSIT', 1000.00, 'signup_bonus_' || NEW.id, 'Welcome bonus');
  
  RETURN NEW;
END;
$$;