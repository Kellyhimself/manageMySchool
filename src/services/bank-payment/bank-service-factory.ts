import { BankAPIConfig } from '@/types/bank-payment';
import { BaseBankService } from './base-bank-service';
import { KCBService } from './kcb-service';
import { EquityService } from './equity-service';
import { CooperativeService } from './cooperative-service';
import { IMService } from './im-service';
import { createClient } from '@supabase/supabase-js';

export class BankServiceFactory {
  static createBankService(config: BankAPIConfig): BaseBankService {
    switch (config.bank_type) {
      case 'kcb':
        return new KCBService(config);
      case 'equity':
        return new EquityService(config);
      case 'cooperative':
        return new CooperativeService(config);
      case 'im':
        return new IMService(config);
      default:
        throw new Error(`Unsupported bank type: ${config.bank_type}`);
    }
  }

  static async getSchoolBankService(schoolId: string): Promise<BaseBankService | null> {
    console.log('Getting bank service for school:', schoolId);
    
    // Create Supabase client only when needed in server-side method
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: school, error } = await supabase
      .from('schools')
      .select('payment_settings')
      .eq('id', schoolId)
      .single();

    if (error) {
      console.error('Failed to get school bank settings:', error);
      return null;
    }

    if (!school?.payment_settings?.bank_api_settings) {
      console.error('No bank settings found for school:', schoolId);
      return null;
    }

    const bankConfig = school.payment_settings.bank_api_settings as BankAPIConfig;
    bankConfig.school_id = schoolId; // Ensure school_id is set

    return this.createBankService(bankConfig);
  }
} 