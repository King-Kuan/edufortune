import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { SchoolInviteEmail } from '@/components/emails/SchoolInvite'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, principalName, schoolName, loginEmail, otp } = body

    if (!to || !principalName || !schoolName || !loginEmail || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const html = render(
      SchoolInviteEmail({ principalName, schoolName, loginEmail, otp })
    )

    const { data, error } = await resend.emails.send({
      from:    'EduFortune <noreply@edufortune.com>',
      to:      [to],
      subject: `Your EduFortune account for ${schoolName} is ready`,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
