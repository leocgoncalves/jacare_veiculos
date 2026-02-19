import Image from "next/image";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";

export function FloatingWhatsApp({ url }: { url?: string }) {
  return (
    <a
      href={normalizeWhatsAppUrl(url)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:brightness-95"
    >
      <Image
        src="/whatsapp-icon.png"
        alt="Ícone do WhatsApp"
        width={56}
        height={56}
        className="h-full w-full object-cover"
      />
    </a>
  );
}
