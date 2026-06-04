-- Add mutual-exclusion constraint field to activities
-- Activities listed in exclusive_with_ids cannot be scheduled on the same day as this activity (per group)

ALTER TABLE activities ADD COLUMN IF NOT EXISTS exclusive_with_ids uuid[] DEFAULT '{}';

-- Example: set swim and waterplay as mutually exclusive
-- UPDATE activities SET exclusive_with_ids = ARRAY[(SELECT id FROM activities WHERE name = 'Waterplay')]::uuid[] WHERE name = 'Swim';
-- UPDATE activities SET exclusive_with_ids = ARRAY[(SELECT id FROM activities WHERE name = 'Swim')]::uuid[]    WHERE name = 'Waterplay';
