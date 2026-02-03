-- Harden RPC functions to prevent cross-user access while preserving service role usage

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
  AND (
    auth.uid() = _user_id
    OR auth.role() = 'service_role'
  )
$$;

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
    AND (
      auth.uid() = _user_id
      OR auth.role() = 'service_role'
      OR public.has_role(auth.uid(), 'admin')
    )
$$;
