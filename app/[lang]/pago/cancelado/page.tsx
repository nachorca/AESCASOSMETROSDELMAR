// app/[lang]/pago/cancelado/page.tsx
import { getTranslations } from "@/lib/i18n";
import { isValidLocale, defaultLocale } from "@/lib/i18n/config";

export default async function PagoCanceladoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const t = getTranslations(locale);

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t("payment.cancelledTitle")}</h1>

      <p>{t("payment.cancelledText")}</p>

      <p>{t("payment.cancelledText2")}</p>

      <a
        href={`/${locale}`}
        style={{
          display: "inline-block",
          marginTop: "24px",
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "8px",
        }}
      >
        {t("payment.backBooking")}
      </a>
    </main>
  );
}
