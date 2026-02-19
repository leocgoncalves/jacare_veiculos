const DEFAULT_WHATSAPP_URL = "https://wa.me/5500000000000";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeWhatsAppUrl(rawValue?: string | null) {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return DEFAULT_WHATSAPP_URL;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("wa.me/")) {
    return `https://${value}`;
  }

  const digits = onlyDigits(value);
  if (!digits) {
    return DEFAULT_WHATSAPP_URL;
  }

  return `https://wa.me/${digits}`;
}

export function getDefaultWhatsAppUrl() {
  return DEFAULT_WHATSAPP_URL;
}
