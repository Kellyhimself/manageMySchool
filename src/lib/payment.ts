import { School } from '@/types/school';
import { createClient } from '@/lib/supabase/server';

export interface PaymentReference {
  schoolId: string;
  feeId: string;
  reference: string;
  amount: number;
  studentAdmissionNumber: string;
  studentName: string;
}

export async function generatePaymentReference(
  school: School,
  feeId: string,
  amount: number,
  studentAdmissionNumber: string,
  studentName: string
): Promise<PaymentReference> {
  const supabase = createClient();
  
  // Generate a unique reference number
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const reference = `REF${timestamp}${random}`;

  // Store the reference in the database
  const { error } = await supabase
    .from('payment_references')
    .insert({
      reference,
      school_id: school.id,
      fee_id: feeId,
      amount,
      student_admission_number: studentAdmissionNumber,
      student_name: studentName,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error('Failed to generate payment reference');
  }

  return {
    schoolId: school.id,
    feeId,
    reference,
    amount,
    studentAdmissionNumber,
    studentName,
  };
}

export function formatPaymentInstructions(
  school: School,
  reference: PaymentReference
): string {
  const { paybill_number, account_number, reference_format } = school.payment_settings!;
  
  const accountReference = reference_format === 'admission_number'
    ? `${account_number}#${reference.studentAdmissionNumber}`
    : `${account_number}#${reference.studentName}`;

  return `
    Paybill Number: ${paybill_number}
    Account Number: ${accountReference}
    Amount: KES ${reference.amount}
    Reference: ${reference.reference}
  `.trim();
}

export async function confirmPayment(
  reference: string,
  paymentDetails: {
    amount: number;
    transactionId: string;
    paymentDate: string;
    paymentMethod: 'mpesa' | 'bank';
  }
) {
  const supabase = createClient();

  // Get the payment reference
  const { data: paymentRef, error: refError } = await supabase
    .from('payment_references')
    .select('*')
    .eq('reference', reference)
    .single();

  if (refError || !paymentRef) {
    throw new Error('Payment reference not found');
  }

  // Update the payment reference status
  const { error: updateError } = await supabase
    .from('payment_references')
    .update({
      status: 'completed',
      transaction_id: paymentDetails.transactionId,
      payment_date: paymentDetails.paymentDate,
      payment_method: paymentDetails.paymentMethod,
    })
    .eq('reference', reference);

  if (updateError) {
    throw new Error('Failed to update payment reference');
  }

  // Update the fee status
  const { error: feeError } = await supabase
    .from('fees')
    .update({
      status: 'paid',
      payment_method: paymentDetails.paymentMethod,
      payment_reference: reference,
      payment_date: paymentDetails.paymentDate,
      amount_paid: paymentDetails.amount,
    })
    .eq('id', paymentRef.fee_id);

  if (feeError) {
    throw new Error('Failed to update fee status');
  }

  return { success: true };
} 