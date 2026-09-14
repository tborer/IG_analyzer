import { Resend } from 'resend'

export const sendVerificationEmail = async (email: string, token: string) => {
  const emailClient = new Resend(process.env.RESEND_API_KEY)
  const response = await emailClient.sendEmail({
    from: 'hello@caliber-analyzer.com',
    to: email,
    subject: 'Verify your email address',
    html: `
      <p>Verify your email to access Caliber Analyzer:</p>
      <a href="https://caliber-analyzer.com/verify?token=${token}">Verify email</a>
    `,
  })
  return response
}