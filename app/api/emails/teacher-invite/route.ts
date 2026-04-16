import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { TeacherInviteEmail } from '@/components/emails/TeacherInvite'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { to, teacherName, schoolName, loginEmail, otp, appUrl } = await req.json()

    const html = render(TeacherInviteEmail({ teacherName, schoolName, loginEmail, otp, appUrl }))

    const { data, error } = await resend.emails.send({
      from:    'EduFortune <noreply@edufortune.com>',
      to:      [to],
      subject: `You've been added to ${schoolName} on EduFortune`,
      html,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
