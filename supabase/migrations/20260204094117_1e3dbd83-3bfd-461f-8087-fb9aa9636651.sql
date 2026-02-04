-- Drop the old check constraint and add a new one with CRASH
ALTER TABLE public.house_edge_settings 
DROP CONSTRAINT IF EXISTS house_edge_settings_game_key_check;

ALTER TABLE public.house_edge_settings 
ADD CONSTRAINT house_edge_settings_game_key_check 
CHECK (game_key = ANY (ARRAY['GLOBAL'::text, 'COINFLIP'::text, 'MINES'::text, 'CRASH'::text]));

-- Add CRASH to house edge settings
INSERT INTO public.house_edge_settings (game_key, edge_percent, effective_from)
VALUES ('CRASH', 0.04, now());

-- Update get_house_edge function to support CRASH
CREATE OR REPLACE FUNCTION public.get_house_edge(_game_key text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  edge numeric;
BEGIN
  -- First try game-specific edge
  SELECT edge_percent INTO edge
  FROM public.house_edge_settings
  WHERE game_key = _game_key
    AND effective_from <= now()
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Fallback to global
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