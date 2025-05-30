import { Resend } from 'resend';
import twilio from 'twilio';

interface WhatsAppTemplateData {
  studentName: string;
  admissionNumber: string;
  amount: number;
  schoolName: string;
  receiptUrl?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private twilioClient: twilio.Twilio;
  private resend: Resend;
  private readonly MAX_RETRIES = 3;
  private readonly SMS_LENGTH_LIMIT = 160;
  private readonly WHATSAPP_TEMPLATE = 'payment_receipt';
  private readonly WHATSAPP_ENABLED = process.env.TWILIO_WHATSAPP_ENABLED === 'true';

  private constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio configuration is missing');
    }

    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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
        
        const response = await this.twilioClient.messages.create({
          body: message,
          to: formattedPhone,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
        });

        if (response.status === 'queued' || response.status === 'sent' || response.status === 'accepted') {
          console.info(`SMS sent successfully to ${formattedPhone.slice(-4)} via Twilio`);
          return true;
        } else {
          throw new Error(`SMS send failed with status: ${response.status}`);
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

  public async sendWhatsApp(phoneNumber: string, templateData: WhatsAppTemplateData): Promise<boolean> {
    if (!this.WHATSAPP_ENABLED) {
      console.info('WhatsApp is not enabled, falling back to SMS');
      const smsMessage = `Dear Parent/Guardian,\n\nPayment confirmation for ${templateData.studentName} (Admission No: ${templateData.admissionNumber})\nAmount: KES ${templateData.amount}\nSchool: ${templateData.schoolName}\n\nReceipt: ${templateData.receiptUrl || 'Not available'}`;
      return this.sendSMS(phoneNumber, smsMessage);
    }

    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        
        const response = await this.twilioClient.messages.create({
          body: `Dear Parent/Guardian,\n\nPayment confirmation for ${templateData.studentName} (Admission No: ${templateData.admissionNumber})\nAmount: KES ${templateData.amount}\nSchool: ${templateData.schoolName}\n\nReceipt: ${templateData.receiptUrl || 'Not available'}`,
          to: formattedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        if (response.status === 'queued' || response.status === 'sent') {
          console.info(`WhatsApp message sent successfully to ${formattedPhone.slice(-4)} via Twilio`);
          return true;
        } else {
          throw new Error(`WhatsApp send failed with status: ${response.status}`);
        }
      } catch (error) {
        console.warn(`WhatsApp send attempt ${attempt} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If WhatsApp fails, fall back to SMS
    console.info('WhatsApp failed, falling back to SMS');
    return this.sendSMS(phoneNumber, `Dear Parent/Guardian,\n\nPayment confirmation for ${templateData.studentName} (Admission No: ${templateData.admissionNumber})\nAmount: KES ${templateData.amount}\nSchool: ${templateData.schoolName}\n\nReceipt: ${templateData.receiptUrl || 'Not available'}`);
  }

  private isValidPhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 12;
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Handle Kenyan numbers
    if (digits.startsWith('0')) {
      // Convert 07XX to +2547XX
      return '+254' + digits.slice(1);
    }
    
    if (digits.startsWith('254')) {
      // Add + prefix
      return '+' + digits;
    }
    
    if (phone.startsWith('+')) {
      // Ensure it starts with +254
      digits = phone.slice(1);
      if (!digits.startsWith('254')) {
        return '+254' + digits;
      }
      return '+' + digits;
    }
    
    // If number is less than 12 digits, assume it's a Kenyan number and add +254
    if (digits.length < 12) {
      return '+254' + digits;
    }
    
    return '+' + digits;
  }
} 