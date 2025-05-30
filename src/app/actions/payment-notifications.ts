'use server';

import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NotificationService } from '@/services/notification.service';
import { Readable } from 'stream';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generatePDF(fee: any, transactionId: string, amount: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        autoFirstPage: true
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add content to PDF
      doc
        .fontSize(20)
        .text('Payment Receipt', { align: 'center' })
        .moveDown()
        .fontSize(12)
        .text(`Receipt Number: ${transactionId}`)
        .text(`Date: ${new Date().toISOString().split('T')[0]}`)
        .text(`School: ${fee.schools.name}`)
        .text(`Student: ${fee.students.name}`)
        .text(`Admission Number: ${fee.students.admission_number}`)
        .text(`Amount Paid: KES ${amount}`)
        .text(`Fee Type: ${fee.fee_type}`)
        .text(`Term: ${fee.term || 'N/A'}`)
        .text(`Academic Year: ${fee.academic_year}`);

      // Add a line
      doc
        .moveTo(50, doc.y + 20)
        .lineTo(545, doc.y + 20)
        .stroke();

      // Add footer
      doc
        .fontSize(10)
        .text('This is a computer-generated receipt and does not require a signature.', 50, doc.y + 30, {
          align: 'center'
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

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
          name,
          admission_number,
          parent_phone,
          parent_email
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
    const receipt = await generatePDF(fee, transactionId, amount);

    // Upload receipt to storage and get URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(`${transactionId}.pdf`, receipt, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      throw new Error(`Failed to upload receipt: ${uploadError.message}`);
    }

    // Get public URL for the receipt
    const { data: { publicUrl: receiptUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(`${transactionId}.pdf`);

    // Send email notification to parent
    if (fee.students.parent_email) {
      await resend.emails.send({
        from: 'noreply@myschool.veylor360.com',
        to: fee.students.parent_email,
        subject: 'Payment Receipt',
        text: `Dear Parent/Guardian,\n\nThis is to confirm that a payment of KES ${amount} has been received for ${fee.students.name} (Admission No: ${fee.students.admission_number}).\n\nPlease find your receipt attached.\n\nBest regards,\n${fee.schools.name}`,
        attachments: [
          {
            filename: `receipt-${transactionId}.pdf`,
            content: receipt
          }
        ]
      });
    }

    // Send notifications to parent's phone
    if (fee.students.parent_phone) {
      const notificationService = NotificationService.getInstance();
      
      // Send SMS
      const smsMessage = `Dear Parent/Guardian, payment of KES ${amount} received for ${fee.students.name} (Adm: ${fee.students.admission_number}). Receipt sent to your email. ${fee.schools.name}`;
      await notificationService.sendSMS(fee.students.parent_phone, smsMessage);

      // Send WhatsApp
      await notificationService.sendWhatsApp(fee.students.parent_phone, {
        studentName: fee.students.name,
        admissionNumber: fee.students.admission_number,
        amount: amount,
        schoolName: fee.schools.name,
        receiptUrl: receiptUrl
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to generate receipt and send notifications:', error);
    throw error;
  }
} 