-- Add vat column to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS vat BOOLEAN DEFAULT FALSE;

-- Update the comments/docs if needed
COMMENT ON COLUMN schools.vat IS 'Flag to indicate if the school should charge VAT on payments';
