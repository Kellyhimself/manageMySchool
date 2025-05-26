import { BaseBankService } from './base-bank-service';
import { BankPaymentRequest, BankPaymentResponse, BankWebhookData } from '@/types/bank-payment';
import axios from 'axios';
import crypto from 'crypto';

export class KCBService extends BaseBankService {
  private generateSignature(data: any): string {
    const message = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.config.api_secret)
      .update(message)
      .digest('hex');
  }

  async initiatePayment(request: BankPaymentRequest): Promise<BankPaymentResponse> {
    try {
      const reference = this.generateReference(request);
      
      // KCB Buni API specific implementation
      const payload = {
        amount: request.amount,
        reference,
        customer: {
          name: request.student_name,
          id: request.student_admission_number
        },
        callback_url: this.config.webhook_url
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(
        `${this.config.api_endpoint}/payments/initiate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
            'X-Signature': signature
          }
        }
      );

      if (response.data.success) {
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
      console.error('KCB payment initiation failed:', error);
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
        `${this.config.api_endpoint}/payments/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`
          }
        }
      );

      return {
        success: response.data.status === 'completed',
        transaction_id: transactionId,
        reference: response.data.reference,
        message: response.data.message
      };
    } catch (error) {
      console.error('KCB payment verification failed:', error);
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
      const webhookData = data as any;
      
      // Verify webhook signature
      const signature = webhookData.signature;
      const calculatedSignature = this.generateSignature({
        transaction_id: webhookData.transaction_id,
        reference: webhookData.reference,
        amount: webhookData.amount,
        status: webhookData.status,
        timestamp: webhookData.timestamp
      });

      if (signature !== calculatedSignature) {
        throw new Error('Invalid webhook signature');
      }

      return {
        bank_type: 'kcb',
        transaction_id: webhookData.transaction_id,
        reference: webhookData.reference,
        amount: webhookData.amount,
        status: this.mapKCBStatus(webhookData.status),
        timestamp: webhookData.timestamp,
        additional_data: webhookData.additional_data
      };
    } catch (error) {
      console.error('KCB webhook validation failed:', error);
      throw error;
    }
  }

  private mapKCBStatus(status: string): 'success' | 'failed' | 'pending' {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'pending';
    }
  }
} 