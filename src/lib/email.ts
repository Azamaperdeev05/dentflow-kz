import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("EMAIL_USER/EMAIL_PASS орнатылмаған. Email орнына код логқа шығарылды.");
    console.info({ to, subject, html });
    return;
  }

  await transporter.sendMail({
    from: `'DentFlow KZ' <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
