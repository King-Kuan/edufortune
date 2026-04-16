import {
  Html, Head, Preview, Body, Container,
  Section, Text, Button, Hr,
} from '@react-email/components'

interface TeacherInviteEmailProps {
  teacherName: string
  schoolName:  string
  loginEmail:  string
  otp:         string
  appUrl?:     string
}

export function TeacherInviteEmail({
  teacherName,
  schoolName,
  loginEmail,
  otp,
  appUrl = 'https://classroom.edufortune.com',
}: TeacherInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been added to {schoolName} on EduFortune</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={header}>
            <Text style={brandName}>EduFortune Classroom</Text>
            <Text style={brandSub}>Teacher Portal</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hello {teacherName},</Text>

            <Text style={paragraph}>
              You have been added as a teacher at <strong>{schoolName}</strong> on EduFortune.
              Use the credentials below to sign in to the teacher portal.
            </Text>

            <Section style={credBox}>
              <Text style={credTitle}>Your login credentials</Text>
              <Text style={credRow}>
                <span style={credLabel}>Portal:</span>{' '}
                <span style={{ color: '#1565e0' }}>{appUrl}</span>
              </Text>
              <Text style={credRow}>
                <span style={credLabel}>Email:</span>{' '}
                <span style={credValue}>{loginEmail}</span>
              </Text>
              <Text style={credRow}>
                <span style={credLabel}>One-time password:</span>{' '}
                <span style={{ ...credValue, fontFamily: 'monospace', letterSpacing: '2px' }}>
                  {otp}
                </span>
              </Text>
            </Section>

            <Text style={paragraph}>
              You will be required to set a new password when you first sign in.
            </Text>

            <Button style={button} href={appUrl}>
              Open teacher portal
            </Button>

            <Hr style={divider} />
            <Text style={smallText}>
              If you were not expecting this invitation, please contact your school administration.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              EduFortune · Powered by <strong>The Palace, Inc.</strong>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const body:      React.CSSProperties = { backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }
const container: React.CSSProperties = { maxWidth: '520px', margin: '32px auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }
const header:    React.CSSProperties = { backgroundColor: '#0e4299', padding: '24px 32px', textAlign: 'center' }
const brandName: React.CSSProperties = { color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 2px' }
const brandSub:  React.CSSProperties = { color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }
const content:   React.CSSProperties = { padding: '32px' }
const greeting:  React.CSSProperties = { fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px' }
const paragraph: React.CSSProperties = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const credBox:   React.CSSProperties = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px 20px', margin: '16px 0' }
const credTitle: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }
const credRow:   React.CSSProperties = { fontSize: '13px', color: '#374151', margin: '0 0 6px' }
const credLabel: React.CSSProperties = { color: '#6b7280', fontWeight: '500' }
const credValue: React.CSSProperties = { color: '#111827', fontWeight: '600' }
const button:    React.CSSProperties = { display: 'inline-block', backgroundColor: '#0e4299', color: '#fff', fontSize: '14px', fontWeight: '600', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', margin: '8px 0 0' }
const divider:   React.CSSProperties = { borderColor: '#e5e7eb', margin: '24px 0' }
const smallText: React.CSSProperties = { fontSize: '12px', color: '#9ca3af', margin: 0 }
const footer:    React.CSSProperties = { backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '16px 32px', textAlign: 'center' }
const footerText:React.CSSProperties = { fontSize: '11px', color: '#9ca3af', margin: 0 }
