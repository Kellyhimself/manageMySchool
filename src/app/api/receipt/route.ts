import { NextResponse } from 'next/server'
import type { Fee } from '@/types/fee'
import { ReceiptService } from '@/services/receipt.service'

export async function POST(request: Request) {
  try {
    const fee: Fee = await request.json()
    const receiptService = ReceiptService.getInstance()
    const dataUrl = await receiptService.generateReceipt(fee)
    return NextResponse.json({ dataUrl })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount)
} 