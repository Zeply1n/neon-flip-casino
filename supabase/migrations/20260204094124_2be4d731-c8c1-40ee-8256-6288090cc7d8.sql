-- Fix search path for get_house_edge function
CREATE OR REPLACE FUNCTION public.get_house_edge(_game_key text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge numeric;
BEGIN
  SELECT edge_percent INTO edge
  FROM public.house_edge_settings
  WHERE game_key = _game_key
    AND effective_from <= now()
  ORDER BY effective_from DESC
  LIMIT 1;

  IF edge IS NULL THEN
    SELECT edge_percent INTO edge
    FROM public.house_edge_settings
    WHERE game_key = 'GLOBAL'
      AND effective_from <= now()
    ORDER BY effective_from DESC
    LIMIT 1;
  END IF;

  RETURN COALESCE(edge, 0.015);
END;
$$;