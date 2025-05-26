'use server'

import { createClient } from '@supabase/supabase-js';

interface ReceiptData {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
}

export async function generateReceipt(data: ReceiptData): Promise<string> {
  try {
    console.log('Generating receipt for fee ID:', data.id);
    
    // Create a server-side Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // First check if the fee exists
    const { data: feeExists, error: checkError } = await supabase
      .from('fees')
      .select('id')
      .eq('id', data.id)
      .single();

    if (checkError) {
      console.error('Error checking fee existence:', checkError);
      throw new Error(`Fee check failed: ${checkError.message}`);
    }

    if (!feeExists) {
      console.error('Fee not found with ID:', data.id);
      throw new Error(`Fee not found with ID: ${data.id}`);
    }

    // Get fee details with correct column names based on schema
    const { data: fee, error } = await supabase
      .from('fees')
      .select(`
        *,
        students!inner (
          name,
          admission_number
        ),
        schools!inner (
          name,
          address
        )
      `)
      .eq('id', data.id)
      .single();

    if (error) {
      console.error('Failed to fetch fee details:', error);
      throw new Error(`Failed to fetch fee details: ${error.message}`);
    }

    if (!fee) {
      console.error('Fee details not found for ID:', data.id);
      throw new Error(`Fee details not found for ID: ${data.id}`);
    }

    console.log('Successfully fetched fee details:', {
      feeId: fee.id,
      studentName: fee.students?.name,
      schoolName: fee.schools?.name
    });

    // Generate receipt content
    const receiptContent = `
      School Fee Receipt
      =================
      
      School: ${fee.schools.name}
      Address: ${fee.schools.address}
      
      Student: ${fee.students.name}
      Admission Number: ${fee.students.admission_number}
      
      Amount Paid: KES ${data.amount}
      Payment Method: ${data.payment_method}
      Payment Reference: ${data.payment_reference}
      Payment Date: ${new Date(data.payment_date).toLocaleString()}
      
      Thank you for your payment!
    `;

    // In a real implementation, you would:
    // 1. Generate a PDF using a library like PDFKit
    // 2. Upload the PDF to a storage service
    // 3. Return the URL of the stored PDF

    // For now, we'll just return a placeholder URL
    return `https://myschool.veylor360.com/receipts/${data.id}.pdf`;
  } catch (error) {
    console.error('Failed to generate receipt:', error);
    throw error;
  }
} 