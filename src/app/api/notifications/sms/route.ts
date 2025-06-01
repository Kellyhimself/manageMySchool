import { NextResponse } from 'next/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    const response = await twilioClient.messages.create({
      body: message,
      to: phoneNumber,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    })

    return NextResponse.json({ success: true, messageId: response.sid })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
} 