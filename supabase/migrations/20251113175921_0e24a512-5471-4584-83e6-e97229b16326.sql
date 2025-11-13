-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_in_blank')),
  correct_answer TEXT NOT NULL,
  options JSONB,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions
CREATE POLICY "Anyone can view questions"
ON public.questions
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_questions_module_id ON public.questions(module_id);

-- Create user_question_attempts table to track answers
CREATE TABLE public.user_question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  user_answer TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts"
ON public.user_question_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own attempts"
ON public.user_question_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_question_attempts_user_id ON public.user_question_attempts(user_id);
CREATE INDEX idx_user_question_attempts_question_id ON public.user_question_attempts(question_id);