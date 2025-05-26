import PDFDocument from 'pdfkit'
import type { Fee } from '@/types/fee'

export class ReceiptService {
  private static instance: ReceiptService

  private constructor() {}

  public static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService()
    }
    return ReceiptService.instance
  }

  public async generateReceipt(fee: Fee): Promise<string> {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })

      // Create a buffer to store the PDF
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))

      // Add header
      doc.fontSize(20).text('Fee Receipt', { align: 'center' })
      doc.moveDown()

      // Add receipt details
      doc.fontSize(12)
      doc.text(`Receipt #: ${fee.id.slice(0, 8)}`)
      doc.text(`Date: ${new Date(fee.date).toLocaleDateString()}`)
      doc.text(`Fee Type: ${fee.feeType}`)
      doc.text(`Amount: ${this.formatCurrency(fee.amount)}`)
      doc.text(`Status: ${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}`)
      doc.moveDown()

      // Add description if available
      if (fee.description) {
        doc.text('Description:')
        doc.text(fee.description)
        doc.moveDown()
      }

      // Add footer
      doc.fontSize(10)
      doc.text('This is a computer-generated receipt and does not require a signature.', {
        align: 'center'
      })

      // Finalize the PDF
      doc.end()

      // Wait for the PDF to be generated
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      // Convert to base64
      const base64Pdf = pdfBuffer.toString('base64')
      return `data:application/pdf;base64,${base64Pdf}`
    } catch (error) {
      console.error('Error generating receipt:', error)
      throw new Error('Failed to generate receipt')
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }
} 