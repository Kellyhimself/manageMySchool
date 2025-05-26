'use server';

import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateReceiptAndNotify(
  feeId: string,
  transactionId: string,
  amount: number
) {
  try {
    // Get fee and student details with correct join
    const { data: fee, error: feeError } = await supabase
      .from('fees')
      .select(`
        *,
        students!inner (
          first_name,
          last_name,
          admission_number,
          email,
          phone
        ),
        schools!inner (
          name,
          address
        )
      `)
      .eq('id', feeId)
      .single();

    if (feeError) {
      console.error('Fee query error:', feeError);
      throw new Error(`Failed to fetch fee details: ${feeError.message}`);
    }

    if (!fee) {
      throw new Error(`Fee not found with ID: ${feeId}`);
    }

    // Generate PDF receipt
    const doc = new PDFDocument();
    const receiptBuffer: Buffer[] = [];

    doc.on('data', (chunk) => receiptBuffer.push(chunk));
    
    doc
      .fontSize(20)
      .text('Payment Receipt', { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Receipt Number: ${transactionId}`)
      .text(`Date: ${new Date().toISOString().split('T')[0]}`)
      .text(`School: ${fee.schools.name}`)
      .text(`Student: ${fee.students.first_name} ${fee.students.last_name}`)
      .text(`Admission Number: ${fee.students.admission_number}`)
      .text(`Amount Paid: KES ${amount}`)
      .text(`Fee Type: ${fee.fee_type}`)
      .text(`Term: ${fee.term || 'N/A'}`)
      .text(`Academic Year: ${fee.academic_year}`);

    doc.end();

    // Wait for PDF generation to complete
    const receipt = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(receiptBuffer));
      });
    });

    // Send email notification
    if (fee.students.email) {
      await resend.emails.send({
        from: 'noreply@myschool.veylor360.com',
        to: fee.students.email,
        subject: 'Payment Receipt',
        text: `Dear ${fee.students.first_name},\n\nThank you for your payment of KES ${amount}.\n\nPlease find your receipt attached.`,
        attachments: [
          {
            filename: `receipt-${transactionId}.pdf`,
            content: receipt
          }
        ]
      });
    }

    // Send SMS notification (if phone number exists)
    if (fee.students.phone) {
      // Implement SMS sending logic here
      // You can use Africa's Talking or any other SMS provider
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to generate receipt and send notifications:', error);
    throw error;
  }
} 