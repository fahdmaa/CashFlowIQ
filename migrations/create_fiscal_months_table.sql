-- Create fiscal_months table to track custom month boundaries
CREATE TABLE IF NOT EXISTS fiscal_months (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_label TEXT NOT NULL, -- e.g., "October 2025"
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE, -- NULL for the current active month
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fiscal_months_user_id ON fiscal_months(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_months_start_date ON fiscal_months(start_date);
CREATE INDEX IF NOT EXISTS idx_fiscal_months_is_active ON fiscal_months(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE fiscal_months ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own fiscal months
CREATE POLICY "Users can view their own fiscal months" ON fiscal_months
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fiscal months" ON fiscal_months
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiscal months" ON fiscal_months
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fiscal months" ON fiscal_months
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_fiscal_months_updated_at
    BEFORE UPDATE ON fiscal_months
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add a unique constraint to ensure only one active month per user
CREATE UNIQUE INDEX unique_active_month_per_user
    ON fiscal_months (user_id, is_active)
    WHERE is_active = true;