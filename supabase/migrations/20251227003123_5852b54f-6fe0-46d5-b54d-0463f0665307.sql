-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create university_domains table for email domain mapping
CREATE TABLE public.university_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text NOT NULL UNIQUE,
    university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on university_domains
ALTER TABLE public.university_domains ENABLE ROW LEVEL SECURITY;

-- Anyone can view domains (needed for onboarding auto-suggest)
CREATE POLICY "Anyone can view university domains"
ON public.university_domains
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage domains
CREATE POLICY "Admins can insert domains"
ON public.university_domains
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update domains"
ON public.university_domains
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete domains"
ON public.university_domains
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add first admin (your user)
INSERT INTO public.user_roles (user_id, role)
VALUES ('d7ff09a2-d253-49bd-ad66-5ead0fd7fcb8', 'admin');

-- Create admin policies for user_onboarding management
CREATE POLICY "Admins can update any user onboarding"
ON public.user_onboarding
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));