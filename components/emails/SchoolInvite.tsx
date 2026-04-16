import {
  Html, Head, Preview, Body, Container,
  Section, Text, Button, Hr, Img,
} from '@react-email/components'

interface SchoolInviteEmailProps {
  principalName: string
  schoolName:    string
  loginEmail:    string
  otp:           string
  loginUrl?:     string
}

export function SchoolInviteEmail({
  principalName,
  schoolName,
  loginEmail,
  otp,
  loginUrl = 'https://admin.edufortune.com/login',
}: SchoolInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your EduFortune account for {schoolName} is ready</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={brandName}>EduFortune</Text>
            <Text style={brandSub}>School Management System</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hello {principalName},</Text>

            <Text style={paragraph}>
              Your school <strong>{schoolName}</strong> has been successfully registered
              on the EduFortune platform. You can now sign in and set up your school.
            </Text>

            {/* Credentials box */}
            <Section style={credBox}>
              <Text style={credTitle}>Your login credentials</Text>
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
              You will be asked to change this password when you first sign in.
              Keep your credentials secure and do not share them.
            </Text>

            <Button style={button} href={loginUrl}>
              Sign in to EduFortune
            </Button>

            <Hr style={divider} />

            <Text style={smallText}>
              If you have any issues accessing your account, please contact EduFortune support.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              EduFortune · Powered by <strong>The Palace, Inc.</strong>
            </Text>
            <Text style={footerText}>
              School management solutions for Rwanda
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const body: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  fontFamily:      'system-ui, -apple-system, sans-serif',
  margin:          0,
  padding:         0,
}

const container: React.CSSProperties = {
  maxWidth:        '520px',
  margin:          '32px auto',
  backgroundColor: '#ffffff',
  borderRadius:    '8px',
  overflow:        'hidden',
  border:          '1px solid #e5e7eb',
}

const header: React.CSSProperties = {
  backgroundColor: '#1565e0',
  padding:         '24px 32px',
  textAlign:       'center',
}

const brandName: React.CSSProperties = {
  color:      '#ffffff',
  fontSize:   '22px',
  fontWeight: '700',
  margin:     '0 0 2px',
}

const brandSub: React.CSSProperties = {
  color:      'rgba(255,255,255,0.7)',
  fontSize:   '13px',
  margin:     0,
}

const content: React.CSSProperties = {
  padding: '32px',
}

const greeting: React.CSSProperties = {
  fontSize:   '16px',
  fontWeight: '600',
  color:      '#111827',
  margin:     '0 0 16px',
}

const paragraph: React.CSSProperties = {
  fontSize:   '14px',
  color:      '#374151',
  lineHeight: '1.6',
  margin:     '0 0 16px',
}

const credBox: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border:          '1px solid #e2e8f0',
  borderRadius:    '6px',
  padding:         '16px 20px',
  margin:          '16px 0',
}

const credTitle: React.CSSProperties = {
  fontSize:   '11px',
  fontWeight: '600',
  color:      '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin:     '0 0 10px',
}

const credRow: React.CSSProperties = {
  fontSize: '13px',
  color:    '#374151',
  margin:   '0 0 6px',
}

const credLabel: React.CSSProperties = {
  color:      '#6b7280',
  fontWeight: '500',
}

const credValue: React.CSSProperties = {
  color:      '#111827',
  fontWeight: '600',
}

const button: React.CSSProperties = {
  display:         'inline-block',
  backgroundColor: '#1565e0',
  color:           '#ffffff',
  fontSize:        '14px',
  fontWeight:      '600',
  padding:         '10px 24px',
  borderRadius:    '6px',
  textDecoration:  'none',
  margin:          '8px 0 0',
}

const divider: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin:      '24px 0',
}

const smallText: React.CSSProperties = {
  fontSize: '12px',
  color:    '#9ca3af',
  margin:   0,
}

const footer: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderTop:       '1px solid #e5e7eb',
  padding:         '16px 32px',
  textAlign:       'center',
}

const footerText: React.CSSProperties = {
  fontSize: '11px',
  color:    '#9ca3af',
  margin:   '0 0 2px',
}
