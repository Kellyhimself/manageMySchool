import { BaseBankService } from './base-bank-service';
import { BankPaymentRequest, BankPaymentResponse, BankWebhookData } from '@/types/bank-payment';
import axios from 'axios';

export class CooperativeService extends BaseBankService {
  async initiatePayment(request: BankPaymentRequest): Promise<BankPaymentResponse> {
    try {
      const reference = this.generateReference(request);
      
      // Cooperative Bank API specific implementation
      const response = await axios.post(
        `${this.config.api_endpoint}/payment/initiate`,
        {
          amount: request.amount,
          reference_number: reference,
          customer_details: {
            name: request.student_name,
            id: request.student_admission_number
          },
          callback_url: this.config.webhook_url,
          payment_type: 'BANK_TRANSFER'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
            'X-Client-ID': this.config.api_key
          }
        }
      );

      if (response.data.status === 'ACCEPTED') {
        await this.updatePaymentStatus(request.fee_id, 'pending', response.data.transaction_id);
        return {
          success: true,
          transaction_id: response.data.transaction_id,
          reference,
          message: 'Payment initiated successfully'
        };
      }

      throw new Error(response.data.message || 'Failed to initiate payment');
    } catch (error) {
      console.error('Cooperative payment initiation failed:', error);
      await this.updatePaymentStatus(
        request.fee_id,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return {
        success: false,
        reference: this.generateReference(request),
        message: error instanceof Error ? error.message : 'Failed to initiate payment'
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<BankPaymentResponse> {
    try {
      const response = await axios.get(
        `${this.config.api_endpoint}/payment/status/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'X-Client-ID': this.config.api_key
          }
        }
      );

      return {
        success: response.data.status === 'COMPLETED',
        transaction_id: transactionId,
        reference: response.data.reference_number,
        message: response.data.message
      };
    } catch (error) {
      console.error('Cooperative payment verification failed:', error);
      return {
        success: false,
        transaction_id: transactionId,
        reference: '',
        message: error instanceof Error ? error.message : 'Failed to verify payment'
      };
    }
  }

  async validateWebhook(data: unknown): Promise<BankWebhookData> {
    try {
      // Validate webhook signature
      const signature = (data as any).signature;
      if (!this.verifySignature(signature, data)) {
        throw new Error('Invalid webhook signature');
      }

      const webhookData = data as any;
      return {
        bank_type: 'cooperative',
        transaction_id: webhookData.transaction_id,
        reference: webhookData.reference_number,
        amount: webhookData.amount,
        status: this.mapCooperativeStatus(webhookData.status),
        timestamp: webhookData.timestamp,
        additional_data: webhookData.additional_data
      };
    } catch (error) {
      console.error('Cooperative webhook validation failed:', error);
      throw error;
    }
  }

  private verifySignature(signature: string, data: unknown): boolean {
    // Implement Cooperative-specific signature verification
    // This is a placeholder - implement according to Cooperative's documentation
    return true;
  }

  private mapCooperativeStatus(status: string): 'success' | 'failed' | 'pending' {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'REJECTED':
        return 'failed';
      default:
        return 'pending';
    }
  }
} 