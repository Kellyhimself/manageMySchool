import { generateReceipt as generateReceiptAction } from '@/app/actions/receipt';

interface ReceiptData {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
}

export async function generateReceipt(data: ReceiptData): Promise<string> {
  try {
    return await generateReceiptAction(data);
  } catch (error) {
    console.error('Failed to generate receipt:', error);
    throw error;
  }
} 