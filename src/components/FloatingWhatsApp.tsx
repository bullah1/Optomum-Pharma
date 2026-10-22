import { memo } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** WhatsApp order button — many customers prefer to order by message. */
const FloatingWhatsApp = memo(({ productName }: { productName?: string }) => {
  const queryClient = useQueryClient();
  const s = queryClient.getQueryData<Record<string, string>>(["site-settings"]);
  const raw = s?.whatsapp_number || s?.contact_phone || "01306383938";
  const digits = raw.replace(/[^0-9]/g, "");
  const number = digits.startsWith("880") ? digits : `88${digits.replace(/^0?/, "0")}`;
  const text = productName
    ? `আসসালামু আলাইকুম, আমি "${productName}" অর্ডার করতে চাই।`
    : "আসসালামু আলাইকুম, আমি ওষুধ অর্ডার করতে চাই।";

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp-এ অর্ডার করুন"
      className="fixed left-4 bottom-20 md:bottom-6 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg pl-3 pr-4 py-2.5 active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.33.68 4.5 1.86 6.34L4 29l7.98-1.82a12.2 12.2 0 0 0 4.06.7C22.68 27.88 28 22.55 28 15.98 28 9.4 22.68 3 16.04 3Zm0 22.6c-1.3 0-2.58-.24-3.78-.7l-.27-.1-4.73 1.08 1.1-4.48-.18-.29a9.7 9.7 0 0 1-1.55-5.21c0-5.42 4.44-9.83 9.9-9.83 5.47 0 9.9 4.92 9.9 10.04 0 5.43-4.44 9.5-10.4 9.5Zm5.43-7.3c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.29-.77.96-.94 1.15-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.78-1.49-1.75-1.66-2.05-.17-.29-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.03-.51-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.29-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.09 3.18 5.06 4.46.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.34Z" />
      </svg>
      <span className="text-xs font-bold">WhatsApp অর্ডার</span>
    </a>
  );
});

FloatingWhatsApp.displayName = "FloatingWhatsApp";
export default FloatingWhatsApp;
