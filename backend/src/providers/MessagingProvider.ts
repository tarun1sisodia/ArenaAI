export type MessageCommand = {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
};

export interface MessagingProvider {
  send(command: MessageCommand): Promise<{ providerMessageId: string }>;
}

export interface EmailProvider {
  send(input: { to: string; subject: string; text: string }): Promise<{ providerMessageId: string }>;
}

export function createNoopMessaging(): MessagingProvider {
  return {
    async send() {
      return { providerMessageId: `wa_noop_${Date.now()}` };
    },
  };
}

export function createNoopEmail(): EmailProvider {
  return {
    async send() {
      return { providerMessageId: `email_noop_${Date.now()}` };
    },
  };
}

function validatePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 14) {
    throw new Error("Invalid phone number for messaging");
  }
  return digits;
}

export function createWhatsAppProvider(token: string, phoneNumberId: string, fetchImpl: typeof fetch = fetch): MessagingProvider {
  if (!token || !phoneNumberId) throw new Error("WhatsApp credentials required");
  return {
    async send(command) {
      const to = validatePhone(command.to);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetchImpl(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: command.templateKey,
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: Object.values(command.variables).map((text) => ({ type: "text", text: String(text).slice(0, 100) })),
                },
              ],
            },
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`WhatsApp send failed: ${response.status} ${text.slice(0, 200)}`);
        }
        const body = (await response.json()) as { messages?: Array<{ id: string }> };
        return { providerMessageId: body.messages?.[0]?.id ?? `wa_${Date.now()}` };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createResendEmailProvider(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): EmailProvider {
  if (!apiKey || !from) throw new Error("Email credentials required");
  if (!from.includes("@")) throw new Error("Invalid from email");
  return {
    async send(input) {
      if (!input.to || !input.to.includes("@")) throw new Error("Invalid recipient email");
      if (input.to.length > 255) throw new Error("Email too long");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [input.to],
            subject: input.subject.slice(0, 200),
            text: input.text.slice(0, 5000),
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`Email send failed: ${response.status} ${text.slice(0, 200)}`);
        }
        const body = (await response.json()) as { id?: string };
        return { providerMessageId: body.id ?? `email_${Date.now()}` };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
