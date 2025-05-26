import { BankAPIConfig, BankPaymentRequest, BankPaymentResponse, BankWebhookData } from '@/types/bank-payment';
import { createClient } from '@supabase/supabase-js';

export abstract class BaseBankService {
  protected config: BankAPIConfig;
  protected supabase;
  protected isTestMode: boolean;

  constructor(config: BankAPIConfig) {
    this.config = config;
    this.isTestMode = !config.is_live;
    // Create a direct Supabase client with service role for server-side operations
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  abstract initiatePayment(request: BankPaymentRequest): Promise<BankPaymentResponse>;
  abstract verifyPayment(transactionId: string): Promise<BankPaymentResponse>;
  abstract validateWebhook(data: unknown): Promise<BankWebhookData>;

  protected async logWebhook(data: unknown, status: 'success' | 'failed' | 'pending', errorMessage?: string) {
    const { data: webhookLog, error } = await this.supabase
      .from('bank_webhook_logs')
      .insert({
        school_id: this.config.school_id,
        bank_type: this.config.bank_type,
        webhook_data: data,
        status,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log webhook:', error);
    }

    return webhookLog;
  }

  async updatePaymentStatus(
    feeId: string,
    status: 'pending' | 'completed' | 'failed',
    transactionId?: string,
    errorMessage?: string,
    paymentAmount?: number
  ) {
    // First get the fee details
    const { data: fee, error: fetchError } = await this.supabase
      .from('fees')
      .select('amount, amount_paid')
      .eq('id', feeId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch fee details:', {
        error: fetchError,
        feeId,
        schoolId: this.config.school_id
      });
      
      // Log to webhook logs for debugging
      await this.logWebhook(
        { feeId, status, transactionId, errorMessage, paymentAmount },
        'failed',
        `Failed to fetch fee details: ${fetchError.message}`
      );
      
      throw fetchError;
    }

    if (!fee) {
      const error = new Error(`Fee not found with ID: ${feeId}`);
      console.error(error.message);
      
      // Log to webhook logs for debugging
      await this.logWebhook(
        { feeId, status, transactionId, errorMessage, paymentAmount },
        'failed',
        error.message
      );
      
      throw error;
    }

    // Calculate new amount paid
    const currentAmountPaid = fee.amount_paid || 0;
    const newAmountPaid = status === 'completed' 
      ? currentAmountPaid + (paymentAmount || fee.amount)
      : currentAmountPaid;

    // Determine if the fee is fully paid
    const isFullyPaid = newAmountPaid >= fee.amount;

    const { error } = await this.supabase
      .from('fees')
      .update({
        status: isFullyPaid ? 'paid' : 'pending',
        payment_method: 'bank',
        payment_reference: transactionId,
        payment_date: status === 'completed' ? new Date().toISOString() : null,
        amount_paid: newAmountPaid,
        payment_details: {
          bank_name: this.config.bank_type,
          transaction_id: transactionId,
          error_message: errorMessage,
          payment_amount: paymentAmount
        }
      })
      .eq('id', feeId);

    if (error) {
      console.error('Failed to update payment status:', {
        error,
        feeId,
        schoolId: this.config.school_id,
        status,
        transactionId
      });
      
      // Log to webhook logs for debugging
      await this.logWebhook(
        { feeId, status, transactionId, errorMessage, paymentAmount },
        'failed',
        `Failed to update payment status: ${error.message}`
      );
      
      throw error;
    }
  }

  protected generateReference(request: BankPaymentRequest): string {
    const timestamp = Date.now().toString().slice(-6);
    const prefix = this.isTestMode ? 'TEST-' : '';
    return `${prefix}${request.fee_id}-${timestamp}`;
  }

  // Test mode specific methods
  protected async simulateTestPayment(request: BankPaymentRequest): Promise<BankPaymentResponse> {
    if (!this.isTestMode) {
      throw new Error('Test mode is not enabled');
    }

    const reference = this.generateReference(request);
    const transactionId = `TEST-${Date.now()}`;

    // Simulate a successful payment after 2 seconds
    setTimeout(async () => {
      await this.updatePaymentStatus(request.fee_id, 'completed', transactionId);
    }, 2000);

    return {
      success: true,
      transaction_id: transactionId,
      reference,
      message: 'Test payment initiated successfully'
    };
  }

  protected async simulateTestWebhook(data: unknown): Promise<BankWebhookData> {
    if (!this.isTestMode) {
      throw new Error('Test mode is not enabled');
    }

    const webhookData = data as {
      transaction_id: string;
      reference: string;
      amount: number;
    };

    return {
      bank_type: this.config.bank_type,
      transaction_id: webhookData.transaction_id,
      reference: webhookData.reference,
      amount: webhookData.amount,
      status: 'success',
      timestamp: new Date().toISOString(),
      additional_data: {
        is_test_mode: true,
        simulated: true
      }
    };
  }
} 