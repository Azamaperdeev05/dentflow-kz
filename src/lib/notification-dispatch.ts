import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

type NotifyInput = {
  userId: string;
  title: string;
  body: string;
  type?: string;
  link?: string;
};

function buildEmailHtml(title: string, body: string, link?: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">${title}</h2>
      <p style="margin: 0 0 12px;">${body}</p>
      ${link ? `<p style="margin: 0;"><a href="${link}" target="_blank" rel="noreferrer">Жүйеге өту</a></p>` : ""}
    </div>
  `;
}

export async function notifyUserChannels({ userId, title, body, type = "INFO", link }: NotifyInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true },
  });

  if (!user) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      title,
      body,
      type,
      link,
    },
  });

  const shouldSendEmail = process.env.NOTIFY_EMAIL_ENABLED === "1" || process.env.NOTIFY_EMAIL_ENABLED === "true";
  const shouldSendSms = process.env.NOTIFY_SMS_ENABLED === "1" || process.env.NOTIFY_SMS_ENABLED === "true";

  if (shouldSendEmail && user.email) {
    await sendEmail({
      to: user.email,
      subject: title,
      html: buildEmailHtml(title, body, link),
    });
  }

  if (shouldSendSms && user.phone) {
    await sendSms({
      to: user.phone,
      text: `${title}: ${body}`,
    });
  }
}
