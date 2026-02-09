
-- Fix 1: Add missing UPDATE policy for device_tokens
CREATE POLICY "Users can update their own tokens"
ON public.device_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Fix 2: Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  clean_display_name TEXT;
BEGIN
  clean_display_name := TRIM(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''));
  
  IF LENGTH(clean_display_name) > 100 THEN
    clean_display_name := SUBSTRING(clean_display_name, 1, 100);
  END IF;
  
  clean_display_name := REGEXP_REPLACE(clean_display_name, '[<>]', '', 'g');
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NULLIF(clean_display_name, ''));
  
  RETURN NEW;
END;
$$;
