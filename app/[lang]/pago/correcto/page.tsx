// app/[lang]/pago/correcto/page.tsx
import { getTranslations } from "@/lib/i18n";
import { isValidLocale, defaultLocale } from "@/lib/i18n/config";

export default async function PagoCorrectoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const t = getTranslations(locale);

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t("payment.successTitle")}</h1>

      <p>{t("payment.successText1")}</p>

      <p>{t("payment.successText2")}</p>

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
        {t("payment.backHome")}
      </a>
    </main>
  );
}
