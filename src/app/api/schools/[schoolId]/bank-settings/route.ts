import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { school_id, bank_type, api_key, api_endpoint, webhook_url, is_live } = data;
    
    if (!school_id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First check if the school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', school_id)
      .single();

    if (schoolError || !school) {
      console.error('School not found:', schoolError);
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Update the school's bank API settings
    const { error } = await supabase
      .from('schools')
      .update({
        bank_api_settings: {
          school_id,
          bank_type,
          api_key,
          api_endpoint,
          webhook_url,
          is_live
        }
      })
      .eq('id', school_id);

    if (error) {
      console.error('Failed to update bank settings:', error);
      return NextResponse.json(
        { error: 'Failed to update bank settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving bank settings:', error);
    return NextResponse.json(
      { error: 'Failed to save bank settings' },
      { status: 500 }
    );
  }
} 