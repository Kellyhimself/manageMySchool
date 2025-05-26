import { NextResponse } from 'next/server';
import { BankServiceFactory } from '@/services/bank-payment/bank-service-factory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const bankService = await BankServiceFactory.getSchoolBankService(schoolId);
    
    if (!bankService) {
      return NextResponse.json(
        { error: 'Bank service not found for school' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error getting bank service:', error);
    return NextResponse.json(
      { error: 'Failed to get bank service' },
      { status: 500 }
    );
  }
} 