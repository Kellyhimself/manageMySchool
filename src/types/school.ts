export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  payment_settings?: {
    bank_name: string;
    paybill_number: string;
    account_number: string;
    reference_format: 'admission_number' | 'student_name';
    api_credentials?: {
      api_key: string;
      api_secret: string;
      is_live: boolean;
    };
  };
} 