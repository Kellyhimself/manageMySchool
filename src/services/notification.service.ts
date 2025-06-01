import { Resend } from 'resend';

interface WhatsAppTemplateData {
  studentName: string;
  admissionNumber: string;
  amount: number;
  schoolName: string;
  receiptUrl?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private resend: Resend | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly SMS_LENGTH_LIMIT = 160;

  private constructor() {
    // Don't initialize services in constructor
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getResendClient(): Resend {
    if (!this.resend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is not configured');
      }
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid Kenyan number
    // Format: 07XXXXXXXX or +254XXXXXXXXX
    return /^(?:\+254|0)[17]\d{8}$/.test(cleaned);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with 0, replace with +254
    if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`;
    }
    
    // If it starts with +254, return as is
    if (cleaned.startsWith('+254')) {
      return cleaned;
    }
    
    // If it doesn't have country code, add +254
    return `+254${cleaned}`;
  }

  public async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    if (message.length > this.SMS_LENGTH_LIMIT) {
      throw new Error(`Message exceeds ${this.SMS_LENGTH_LIMIT} characters limit`);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        console.log(`Original phone: ${phoneNumber}, Formatted phone: ${formattedPhone}`);
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/notifications/sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            message
          })
        });

        if (!response.ok) {
          throw new Error(`SMS API returned ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          console.info(`SMS sent successfully to ${formattedPhone.slice(-4)}`);
          return true;
        } else {
          throw new Error(result.error || 'Failed to send SMS');
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`SMS send attempt ${attempt} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Failed to send SMS after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  public async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    try {
      const resend = this.getResendClient();
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        text
      });

      if (!response || response.error) {
        throw new Error(response?.error?.message || 'Failed to send email');
      }

      console.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  public async sendWhatsApp(phoneNumber: string, templateData: WhatsAppTemplateData): Promise<boolean> {
    const message = `Dear Parent/Guardian,\n\nPayment confirmation for ${templateData.studentName} (Admission No: ${templateData.admissionNumber})\nAmount: KES ${templateData.amount}\nSchool: ${templateData.schoolName}\n\nReceipt: ${templateData.receiptUrl || 'Not available'}`;
    
    // For now, fall back to SMS since WhatsApp requires server-side implementation
    return this.sendSMS(phoneNumber, message);
  }
} 