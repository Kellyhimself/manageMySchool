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

    // Verify Twilio account status
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
    console.log('Twilio Account Status:', {
      status: account.status,
      type: account.type,
      friendlyName: account.friendlyName
    })

    // Check if account is in trial mode
    if (account.type === 'Trial') {
      console.warn('Twilio account is in trial mode. Messages will only be sent to verified numbers.')
    }

    // Verify messaging service
    const messagingService = await twilioClient.messaging.services(process.env.TWILIO_MESSAGING_SERVICE_SID).fetch()
    console.log('Messaging Service Status:', {
      sid: messagingService.sid,
      friendlyName: messagingService.friendlyName,
      status: messagingService.status,
      inboundRequestUrl: messagingService.inboundRequestUrl,
      fallbackUrl: messagingService.fallbackUrl
    })

    console.log('Sending SMS via Twilio:', {
      to: phoneNumber,
      messageLength: message.length,
      message: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    })

    const response = await twilioClient.messages.create({
      body: message,
      to: phoneNumber,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    })

    console.log('Twilio API Response:', {
      sid: response.sid,
      status: response.status,
      errorCode: response.errorCode,
      errorMessage: response.errorMessage,
      direction: response.direction,
      price: response.price,
      priceUnit: response.priceUnit,
      numSegments: response.numSegments,
      numMedia: response.numMedia
    })

    if (response.errorCode || response.errorMessage) {
      throw new Error(`Twilio error: ${response.errorCode} - ${response.errorMessage}`)
    }

    // Check if message was actually queued for delivery
    if (response.status === 'accepted' && account.type === 'Trial') {
      console.warn('Message accepted but may not be delivered in trial mode. Please verify the recipient number or upgrade your account.')
    }

    return NextResponse.json({ 
      success: true, 
      messageId: response.sid,
      status: response.status,
      price: response.price,
      trialMode: account.type === 'Trial',
      warning: account.type === 'Trial' ? 'Account is in trial mode. Messages will only be sent to verified numbers.' : undefined
    })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send SMS',
        details: error,
        trialMode: true
      },
      { status: 500 }
    )
  }
} 