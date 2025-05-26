import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BankAPIConfig } from '@/types/bank-payment';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Received bank settings data:', data);
    
    const { school_id, bank_type, api_key, api_secret, api_endpoint, webhook_url, is_live } = data;
    
    if (!school_id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    if (!bank_type) {
      return NextResponse.json(
        { error: 'Bank type is required' },
        { status: 400 }
      );
    }

    if (!api_key || !api_secret || !api_endpoint || !webhook_url) {
      return NextResponse.json(
        { error: 'All API fields are required' },
        { status: 400 }
      );
    }

    // Use service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First check if the school exists and get current payment settings
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, payment_settings')
      .eq('id', school_id)
      .single();

    if (schoolError || !school) {
      console.error('School not found:', schoolError);
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Create bank settings object that matches BankAPIConfig type
    const bankSettings: BankAPIConfig = {
      bank_type,
      api_key,
      api_secret,
      api_endpoint,
      webhook_url,
      is_live: is_live ?? false
    };
    console.log('Updating bank settings:', bankSettings);

    // Get existing payment settings or create default structure
    const existingSettings = school.payment_settings || {
      bank_name: '',
      paybill_number: '',
      account_number: '',
      reference_format: 'admission_number'
    };

    // Update the school's payment settings, preserving existing settings
    const { data: updateData, error: updateError } = await supabase
      .from('schools')
      .update({
        payment_settings: {
          ...existingSettings,
          bank_api_settings: bankSettings
        }
      })
      .eq('id', school_id)
      .select();

    if (updateError) {
      console.error('Failed to update bank settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bank settings', details: updateError },
        { status: 500 }
      );
    }

    console.log('Bank settings updated successfully:', updateData);
    return NextResponse.json({ success: true, data: updateData });
  } catch (error) {
    console.error('Error saving bank settings:', error);
    return NextResponse.json(
      { error: 'Failed to save bank settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 