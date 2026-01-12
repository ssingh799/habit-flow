-- Drop the overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Users can search other profiles" ON public.profiles;

-- Create a new policy that requires authentication for profile search
-- This protects sensitive health data (weight, height, DOB, gender) from public access
CREATE POLICY "Authenticated users can search profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);