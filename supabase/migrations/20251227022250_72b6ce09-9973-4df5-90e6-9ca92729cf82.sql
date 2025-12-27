
-- Create cohort_messages table for chat
CREATE TABLE public.cohort_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_cohort_messages_cohort_id ON public.cohort_messages(cohort_id);
CREATE INDEX idx_cohort_messages_created_at ON public.cohort_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.cohort_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their cohort
CREATE POLICY "Users can view messages in their cohort"
ON public.cohort_messages
FOR SELECT
USING (
  cohort_id IN (
    SELECT cohort_id FROM public.user_onboarding WHERE user_id = auth.uid()
  )
);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.cohort_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND message_type = 'user'
  AND cohort_id IN (
    SELECT cohort_id FROM public.user_onboarding WHERE user_id = auth.uid()
  )
  AND char_length(content) <= 140
);

-- Service role can insert system messages (for triggers/functions)
CREATE POLICY "Service can insert system messages"
ON public.cohort_messages
FOR INSERT
WITH CHECK (message_type = 'system' AND user_id IS NULL);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.cohort_messages;

-- Function to create system message when challenge completes
CREATE OR REPLACE FUNCTION public.create_challenge_system_message()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name TEXT;
  opponent_name TEXT;
  winner_name TEXT;
  loser_name TEXT;
  msg TEXT;
BEGIN
  -- Only trigger on status change to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get player names
    SELECT full_name INTO challenger_name FROM public.profiles WHERE id = NEW.challenger_user_id;
    SELECT full_name INTO opponent_name FROM public.profiles WHERE id = NEW.opponent_user_id;
    
    IF NEW.is_draw THEN
      msg := COALESCE(challenger_name, 'Someone') || ' and ' || COALESCE(opponent_name, 'someone') || ' tied in a Lightning Round ⚡';
    ELSIF NEW.winner_user_id = NEW.challenger_user_id THEN
      winner_name := challenger_name;
      loser_name := opponent_name;
      
      -- Check if this is a revenge match
      IF NEW.previous_challenge_id IS NOT NULL THEN
        msg := COALESCE(winner_name, 'Someone') || ' got revenge on ' || COALESCE(loser_name, 'someone') || '! 🔥';
      ELSE
        msg := COALESCE(winner_name, 'Someone') || ' beat ' || COALESCE(loser_name, 'someone') || ' in a Lightning Round ⚡';
      END IF;
    ELSE
      winner_name := opponent_name;
      loser_name := challenger_name;
      
      IF NEW.previous_challenge_id IS NOT NULL THEN
        msg := COALESCE(winner_name, 'Someone') || ' got revenge on ' || COALESCE(loser_name, 'someone') || '! 🔥';
      ELSE
        msg := COALESCE(winner_name, 'Someone') || ' beat ' || COALESCE(loser_name, 'someone') || ' in a Lightning Round ⚡';
      END IF;
    END IF;
    
    -- Insert system message
    INSERT INTO public.cohort_messages (cohort_id, user_id, message_type, content, metadata)
    VALUES (
      NEW.cohort_id, 
      NULL, 
      'system', 
      msg,
      jsonb_build_object(
        'challenge_id', NEW.id,
        'winner_id', NEW.winner_user_id,
        'is_draw', NEW.is_draw,
        'is_revenge', NEW.previous_challenge_id IS NOT NULL
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for challenge completion
CREATE TRIGGER on_challenge_complete
AFTER UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.create_challenge_system_message();
