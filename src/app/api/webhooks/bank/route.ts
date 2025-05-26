import { NextRequest, NextResponse } from 'next/server';
import { BankServiceFactory } from '@/services/bank-payment/bank-service-factory';
import { generateReceiptAndNotify } from '@/app/actions/payment-notifications';

export async function POST(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-school-id');
    const bankType = req.headers.get('x-bank-type');

    if (!schoolId || !bankType) {
      return NextResponse.json(
        { error: 'School ID and Bank Type are required' },
        { status: 400 }
      );
    }

    const data = await req.json();
    console.log('Received webhook data:', data);

    // Get the appropriate bank service
    const bankService = await BankServiceFactory.getSchoolBankService(schoolId);
    if (!bankService) {
      return NextResponse.json(
        { error: 'Bank service not found for school' },
        { status: 404 }
      );
    }

    // Validate webhook data
    const webhookData = await bankService.validateWebhook(data);

    // Extract fee ID from reference
    // Format: TEST-feeId-timestamp or feeId-timestamp
    const feeId = webhookData.reference.includes('TEST-') 
      ? webhookData.reference.split('TEST-')[1].split('-')[0]
      : webhookData.reference.split('-')[0];

    console.log('Processing webhook for fee ID:', feeId);

    // Update payment status
    await bankService.updatePaymentStatus(
      feeId,
      webhookData.status === 'success' ? 'completed' : 'failed',
      webhookData.transaction_id,
      webhookData.status === 'failed' ? 'Payment failed' : undefined,
      webhookData.amount
    );

    // Generate receipt and send notifications for successful payments
    if (webhookData.status === 'success') {
      await generateReceiptAndNotify(
        feeId,
        webhookData.transaction_id,
        webhookData.amount
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 