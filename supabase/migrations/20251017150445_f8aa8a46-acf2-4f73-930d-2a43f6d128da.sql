-- Admin override policies for Ouija tables

-- ouija_rooms policies
CREATE POLICY "Admins can view all ouija rooms"
ON public.ouija_rooms
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ouija rooms"
ON public.ouija_rooms
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ouija rooms"
ON public.ouija_rooms
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ouija rooms"
ON public.ouija_rooms
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ouija_questions policies
CREATE POLICY "Admins can view all ouija questions"
ON public.ouija_questions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ouija questions"
ON public.ouija_questions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ouija questions"
ON public.ouija_questions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ouija questions"
ON public.ouija_questions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ouija_participants policies
CREATE POLICY "Admins can view all ouija participants"
ON public.ouija_participants
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can add ouija participants"
ON public.ouija_participants
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ouija participants"
ON public.ouija_participants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));