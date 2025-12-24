-- Add media support to messages table
ALTER TABLE messages 
ADD COLUMN media_url text,
ADD COLUMN media_type text;

-- Add check constraint for valid media types
ALTER TABLE messages
ADD CONSTRAINT messages_media_type_check 
CHECK (media_type IN ('image', 'video', 'audio', 'file') OR media_type IS NULL);

-- Create index for media queries
CREATE INDEX idx_messages_media ON messages(media_type) WHERE media_type IS NOT NULL;

-- Allow content to be nullable since media-only messages are valid
ALTER TABLE messages 
ALTER COLUMN content DROP NOT NULL;