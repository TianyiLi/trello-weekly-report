import nodemailer from 'nodemailer'

interface Arg {
  auth: { user: string; password: string }
  html: string
  to: string
  cc: string
}

export function sendMail({ auth, html, to, cc }: Arg) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    tls: { ciphers: 'SSLv3' },
    auth,
  })
  return transporter.sendMail({
    cc,
    html,
    from: auth.user,
    to,
  })
}
