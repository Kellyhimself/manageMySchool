-- Add school_id to curriculum_levels
ALTER TABLE curriculum_levels ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE curriculum_levels ADD CONSTRAINT curriculum_levels_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- Add school_id to subjects
ALTER TABLE subjects ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE subjects ADD CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- Add school_id to report_cards
ALTER TABLE report_cards ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE report_cards ADD CONSTRAINT report_cards_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- Update existing records to have a default school_id (you'll need to replace 'default_school_id' with an actual school ID)
UPDATE curriculum_levels SET school_id = 'default_school_id' WHERE school_id IS NULL;
UPDATE subjects SET school_id = 'default_school_id' WHERE school_id IS NULL;
UPDATE report_cards SET school_id = 'default_school_id' WHERE school_id IS NULL;

-- Make school_id NOT NULL after setting default values
ALTER TABLE curriculum_levels ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE report_cards ALTER COLUMN school_id SET NOT NULL; 