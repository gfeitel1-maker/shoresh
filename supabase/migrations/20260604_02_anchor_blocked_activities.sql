-- Add per-anchor activity exclusion list
-- Activities in blocked_activity_ids cannot be scheduled for the same group on the same day as this anchor

ALTER TABLE anchor_activities ADD COLUMN IF NOT EXISTS blocked_activity_ids uuid[] DEFAULT '{}';

-- Example: block Water Play on any day a group has the Swim anchor
-- UPDATE anchor_activities
--   SET blocked_activity_ids = ARRAY[(SELECT id FROM activities WHERE name = 'Water Play')]::uuid[]
--   WHERE id = '<swim-anchor-id>';
