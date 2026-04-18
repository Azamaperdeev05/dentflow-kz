type SendSmsInput = {
  to: string;
  text: string;
};

export async function sendSms({ to, text }: SendSmsInput) {
  const endpoint = process.env.SMS_WEBHOOK_URL;

  if (!endpoint) {
    console.info("SMS_WEBHOOK_URL орнатылмаған. SMS хабарлама логқа жазылды.", { to, text });
    return;
  }

  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, text }),
  });
}
