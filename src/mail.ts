import nodemailer from 'nodemailer';

interface Arg {
  auth: { user: string; pass: string };
  html: string;
  to: string;
  cc?: string;
  subject: string;
}

export function list2HTML(lists: { [x: string]: string[] }) {
  const result = Object.entries(lists)
    .reduce((prev, curr) => {
      prev.push(`--${curr[0]}--<br/><ul>`)
      curr[1].forEach(name => prev.push(`<li>${name}</li>`))
      prev.push('</ul>')
      return prev
    }, [] as string[])
  
    return result.join('');
}

export function sendMail({ auth, html, to, cc, subject }: Arg) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    tls: { ciphers: 'SSLv3' },
    auth,
  });
  return transporter.sendMail({
    cc,
    html,
    from: auth.user,
    to,
    subject
  });
}
