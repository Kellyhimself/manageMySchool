import { BaseBankService } from './base-bank-service';
import { BankPaymentRequest, BankPaymentResponse, BankWebhookData } from '@/types/bank-payment';
import axios from 'axios';

export class IMService extends BaseBankService {
  async initiatePayment(request: BankPaymentRequest): Promise<BankPaymentResponse> {
    try {
      const reference = this.generateReference(request);
      
      // I&M Bank API specific implementation
      const response = await axios.post(
        `${this.config.api_endpoint}/transactions/create`,
        {
          amount: request.amount,
          payment_reference: reference,
          payer: {
            name: request.student_name,
            identifier: request.student_admission_number
          },
          notification_url: this.config.webhook_url,
          payment_method: 'BANK_TRANSFER'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
            'X-API-Version': '1.0'
          }
        }
      );

      if (response.data.status === 'INITIATED') {
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
      console.error('I&M payment initiation failed:', error);
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
        `${this.config.api_endpoint}/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'X-API-Version': '1.0'
          }
        }
      );

      return {
        success: response.data.status === 'SUCCESSFUL',
        transaction_id: transactionId,
        reference: response.data.payment_reference,
        message: response.data.message
      };
    } catch (error) {
      console.error('I&M payment verification failed:', error);
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
        bank_type: 'im',
        transaction_id: webhookData.transaction_id,
        reference: webhookData.payment_reference,
        amount: webhookData.amount,
        status: this.mapIMStatus(webhookData.status),
        timestamp: webhookData.timestamp,
        additional_data: webhookData.additional_data
      };
    } catch (error) {
      console.error('I&M webhook validation failed:', error);
      throw error;
    }
  }

  private verifySignature(signature: string, data: unknown): boolean {
    // Implement I&M-specific signature verification
    // This is a placeholder - implement according to I&M's documentation
    return true;
  }

  private mapIMStatus(status: string): 'success' | 'failed' | 'pending' {
    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
} 