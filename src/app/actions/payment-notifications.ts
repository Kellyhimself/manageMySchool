'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NotificationService } from '@/services/notification.service';
import { feeService } from '@/services/fee.service';
import { studentService } from '@/services/student.service';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateReceipt(fee: any, transactionId: string, amount: number): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            background-color: #f9f9f9;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
          }
          .school-name {
            color: #7f8c8d;
            font-size: 18px;
            margin-top: 10px;
          }
          .receipt-details {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .receipt-details p {
            margin: 10px 0;
          }
          .amount {
            font-size: 20px;
            color: #27ae60;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background: #e8f5e9;
            border-radius: 4px;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #7f8c8d;
            font-size: 12px;
          }
          .receipt-number {
            color: #7f8c8d;
            font-size: 12px;
            text-align: right;
            margin-bottom: 20px;
          }
          .print-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            margin: 20px 0;
            cursor: pointer;
            border: none;
            font-size: 16px;
          }
          .print-button:hover {
            background-color: #2980b9;
          }
          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }
            .receipt-container {
              box-shadow: none;
              padding: 20px;
              max-width: 100%;
            }
            .print-button {
              display: none;
            }
            .receipt-details {
              background: none;
              border: 1px solid #ddd;
            }
            .amount {
              background: none;
              border: 1px solid #27ae60;
            }
            .header {
              border-bottom: 1px solid #000;
            }
            .footer {
              border-top: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>Payment Receipt</h1>
            <div class="school-name">${fee.schools.name}</div>
          </div>
          
          <div class="receipt-number">
            Receipt No: ${transactionId}
          </div>

          <div class="receipt-details">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Student Name:</strong> ${fee.students.name}</p>
            <p><strong>Admission Number:</strong> ${fee.students.admission_number}</p>
            <p><strong>Fee Type:</strong> ${fee.fee_type || 'School Fees'}</p>
            <p><strong>Description:</strong> ${fee.description || 'N/A'}</p>
          </div>

          <div class="amount">
            Amount Paid: KES ${amount.toLocaleString()}
          </div>

          <div style="text-align: center;">
            <button class="print-button" onclick="window.print()">Print Receipt</button>
          </div>

          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>Thank you for your payment!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function generateReceiptAndNotify(
  feeId: string,
  transactionId: string,
  amount: number
) {
  try {
    console.log('Starting receipt generation and notification process...');
    
    // Get fee details with relationships using Supabase
    const { data: fee, error: feeError } = await supabase
      .from('fees')
      .select(`
        *,
        students (
          name,
          admission_number,
          parent_phone,
          parent_email
        ),
        schools (
          name,
          address
        )
      `)
      .eq('id', feeId)
      .single();

    if (feeError) {
      throw new Error(`Failed to fetch fee details: ${feeError.message}`);
    }

    if (!fee) {
      throw new Error(`Fee not found with ID: ${feeId}`);
    }

    // Generate receipt HTML
    const receiptHtml = generateReceipt(fee, transactionId, amount);

    // Store receipt URL in the fee record
    const { error: updateError } = await supabase
      .from('fees')
      .update({
        receipt_url: `/receipts/${feeId}.html`,
        updated_at: new Date().toISOString()
      })
      .eq('id', feeId);

    if (updateError) {
      throw new Error(`Failed to update fee with receipt URL: ${updateError.message}`);
    }

    // Send notifications
    const notificationService = NotificationService.getInstance();
    const receiptUrl = `/receipts/${feeId}.html`;

    // Send email notification if parent email exists
    if (fee.students.parent_email) {
      try {
        await notificationService.sendEmail(
          fee.students.parent_email,
          'Payment Receipt',
          `Dear Parent/Guardian,\n\nThis is to confirm that a payment of KES ${amount.toLocaleString()} has been received for ${fee.students.name} (Admission No: ${fee.students.admission_number}).\n\nPlease find your receipt at: ${receiptUrl}\n\nBest regards,\n${fee.schools.name}`
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
        // Continue with other notifications
      }
    }

    // Send SMS notification if parent phone exists
    if (fee.students.parent_phone) {
      try {
        const smsMessage = `Payment of KES ${amount.toLocaleString()} received for ${fee.students.name}. Check email for receipt.`;
        await notificationService.sendSMS(fee.students.parent_phone, smsMessage);
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
        // Continue with other notifications
      }
    }

    // Send WhatsApp notification if parent phone exists
    if (fee.students.parent_phone) {
      try {
        await notificationService.sendWhatsApp(fee.students.parent_phone, {
          studentName: fee.students.name,
          admissionNumber: fee.students.admission_number,
          amount: amount,
          schoolName: fee.schools.name,
          receiptUrl: receiptUrl
        });
      } catch (error) {
        console.error('Failed to send WhatsApp notification:', error);
        // Continue with other notifications
      }
    }

    return {
      receiptHtml,
      receiptUrl
    };
  } catch (error) {
    console.error('Failed to generate receipt and send notifications:', error);
    throw error;
  }
} 