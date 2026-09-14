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

export function createWhatsAppProvider(token: string, phoneNumberId: string, fetchImpl: typeof fetch = fetch): MessagingProvider {
  return {
    async send(command) {
      const response = await fetchImpl(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: command.to.replace(/[^\d]/g, ""),
          type: "template",
          template: {
            name: command.templateKey,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: Object.values(command.variables).map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`WhatsApp send failed: ${response.status}`);
      }
      const body = (await response.json()) as { messages?: Array<{ id: string }> };
      return { providerMessageId: body.messages?.[0]?.id ?? `wa_${Date.now()}` };
    },
  };
}

export function createResendEmailProvider(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): EmailProvider {
  return {
    async send(input) {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
        }),
      });
      if (!response.ok) {
        throw new Error(`Email send failed: ${response.status}`);
      }
      const body = (await response.json()) as { id?: string };
      return { providerMessageId: body.id ?? `email_${Date.now()}` };
    },
  };
}
