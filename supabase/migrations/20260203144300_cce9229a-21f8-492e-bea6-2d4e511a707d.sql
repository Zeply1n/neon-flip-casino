-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create ledger_entries table for wallet
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'REFUND')),
  amount DECIMAL(18, 2) NOT NULL,
  ref_id TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create house_edge_settings table
CREATE TABLE public.house_edge_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key TEXT NOT NULL CHECK (game_key IN ('GLOBAL', 'COINFLIP', 'MINES')),
  edge_percent DECIMAL(5, 4) NOT NULL DEFAULT 0.015,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provably_fair_seeds table
CREATE TABLE public.provably_fair_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL DEFAULT 'default_client_seed',
  nonce INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mines_games table
CREATE TABLE public.mines_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bet_amount DECIMAL(18, 2) NOT NULL,
  mines_count INTEGER NOT NULL CHECK (mines_count >= 1 AND mines_count <= 24),
  mine_positions INTEGER[] NOT NULL,
  revealed_positions INTEGER[] NOT NULL DEFAULT '{}',
  current_multiplier DECIMAL(10, 6) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  payout DECIMAL(18, 2),
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  house_edge DECIMAL(5, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create coinflip_games table
CREATE TABLE public.coinflip_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bet_amount DECIMAL(18, 2) NOT NULL,
  chosen_side TEXT NOT NULL CHECK (chosen_side IN ('heads', 'tails')),
  result TEXT NOT NULL CHECK (result IN ('heads', 'tails')),
  won BOOLEAN NOT NULL,
  payout DECIMAL(18, 2) NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  house_edge DECIMAL(5, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('crypto', 'voucher', 'manual')),
  amount DECIMAL(18, 2),
  reference TEXT,
  voucher_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  method TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_edge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provably_fair_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mines_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coinflip_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user balance from ledger
CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id UUID)
RETURNS DECIMAL(18, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(18, 2)
  FROM public.ledger_entries
  WHERE user_id = _user_id
$$;

-- Function to get current house edge for a game
CREATE OR REPLACE FUNCTION public.get_house_edge(_game_key TEXT)
RETURNS DECIMAL(5, 4)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT edge_percent FROM public.house_edge_settings 
     WHERE game_key = _game_key AND effective_from <= now() 
     ORDER BY effective_from DESC LIMIT 1),
    (SELECT edge_percent FROM public.house_edge_settings 
     WHERE game_key = 'GLOBAL' AND effective_from <= now() 
     ORDER BY effective_from DESC LIMIT 1),
    0.015
  )
$$;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: only admins can view/manage
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ledger: users see own, admins see all
CREATE POLICY "Users can view own ledger" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- House edge: everyone can read, admins can write
CREATE POLICY "Everyone can view house edge" ON public.house_edge_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage house edge" ON public.house_edge_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Provably fair seeds: users see own
CREATE POLICY "Users can view own seeds" ON public.provably_fair_seeds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own client seed" ON public.provably_fair_seeds FOR UPDATE USING (auth.uid() = user_id);

-- Mines games: users see own, admins see all
CREATE POLICY "Users can view own mines games" ON public.mines_games FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Coinflip games: users see own, admins see all
CREATE POLICY "Users can view own coinflip games" ON public.coinflip_games FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Deposit requests: users see own, admins see all
CREATE POLICY "Users can view own deposits" ON public.deposit_requests FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create deposits" ON public.deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update deposits" ON public.deposit_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawal requests: users see own, admins see all
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Vouchers: admins only (users redeem via edge function)
CREATE POLICY "Admins can manage vouchers" ON public.vouchers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs: admins only
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile and seeds on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _server_seed TEXT;
  _server_seed_hash TEXT;
BEGIN
  -- Generate server seed
  _server_seed := encode(gen_random_bytes(32), 'hex');
  _server_seed_hash := encode(sha256(_server_seed::bytea), 'hex');
  
  -- Create profile with username from email
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default house edge settings
INSERT INTO public.house_edge_settings (game_key, edge_percent, effective_from)
VALUES 
  ('GLOBAL', 0.015, now()),
  ('COINFLIP', 0.02, now()),
  ('MINES', 0.015, now());

-- Enable realtime for games (live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.coinflip_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mines_games;