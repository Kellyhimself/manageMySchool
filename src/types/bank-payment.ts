export type BankType = 'kcb' | 'equity' | 'cooperative' | 'im' | 'other';

export interface BankAPIConfig {
  bank_type: BankType;
  api_endpoint: string;
  api_key: string;
  api_secret: string;
  webhook_url: string;
  is_live: boolean;
  school_id: string;
  additional_config?: Record<string, unknown>;
}

export interface BankPaymentRequest {
  school_id: string;
  fee_id: string;
  amount: number;
  student_admission_number: string;
  student_name: string;
  reference: string;
}

export interface BankPaymentResponse {
  success: boolean;
  transaction_id?: string;
  reference: string;
  message: string;
  error_code?: string;
  error_message?: string;
}

export interface BankWebhookData {
  bank_type: BankType;
  transaction_id: string;
  reference: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  additional_data?: Record<string, unknown>;
}

export interface BankPaymentStatus {
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  payment_date?: string;
  bank_name?: string;
  bank_transaction_id?: string;
  error_message?: string;
} 