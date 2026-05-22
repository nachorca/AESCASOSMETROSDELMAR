// app/[lang]/page.tsx
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { propertyConfig } from "@/lib/property";
import HeroCarousel from "@/components/HeroCarousel";
import GalleryGrid from "@/components/GalleryGrid";
import { getTranslations } from "@/lib/i18n";
import { isValidLocale, defaultLocale } from "@/lib/i18n/config";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const t = getTranslations(locale);

  const waNumber = propertyConfig.whatsappPhone;
  const waText = encodeURIComponent(
    `Hola, quiero consultar disponibilidad del apartamento ${propertyConfig.name} en ${propertyConfig.city}.`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;

  const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    propertyConfig.mapsQuery
  )}&output=embed`;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-900">
      {/* ============== HEADER ============== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-white">
          <a href={`/${locale}`} className="font-semibold tracking-wide">
            {propertyConfig.brand}
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/85">
            <a href="#apartamento" className="hover:text-white">
              {t("nav.apartment")}
            </a>
            <a href="#servicios" className="hover:text-white">
              {t("nav.services")}
            </a>
            <a href="#ubicacion" className="hover:text-white">
              {t("nav.location")}
            </a>
            <a href="#galeria" className="hover:text-white">
              {t("nav.gallery")}
            </a>
            <a href="#reservar" className="hover:text-white">
              {t("nav.book")}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />

            <a
              href="#reservar"
              className="bg-white text-slate-900 px-5 py-2 rounded-2xl text-sm font-medium hover:bg-white/90 transition"
            >
              {t("nav.book")}
            </a>
          </div>
        </div>
      </header>

      {/* ============== HERO ============== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <HeroCarousel />

        <div className="relative z-10 max-w-5xl text-center text-white">
          <p className="uppercase tracking-[0.35em] text-white/80 mb-6">
            {t("hero.location")}
          </p>

          <h1 className="text-5xl md:text-8xl font-semibold mb-4">
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl italic text-white/75 mb-8">
            {t("hero.subtitle")}
          </p>

          <p className="text-xl md:text-2xl text-white/90 mb-10">
            {t("hero.description")}
          </p>

          <div className="flex gap-4 justify-center mb-16 flex-wrap">
            <a
              href="#reservar"
              className="bg-slate-900 text-white px-7 py-4 rounded-2xl hover:bg-slate-800 transition"
            >
              {t("hero.bookNow")}
            </a>
            <a
              href="#apartamento"
              className="border border-white/60 text-white px-7 py-4 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition"
            >
              {t("hero.seeApartment")}
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-left">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-slate-900">
                {t("hero.card1Title")}
              </h2>
              <p className="text-slate-600">{t("hero.card1Text")}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-slate-900">
                {t("hero.card2Title")}
              </h2>
              <p className="text-slate-600">{t("hero.card2Text")}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-slate-900">
                {t("hero.card3Title")}
              </h2>
              <p className="text-slate-600">{t("hero.card3Text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TARJETAS RÁPIDAS ============== */}
      <section id="apartamento" className="px-6 py-16 bg-[#f7f4ee]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-4">
          {[
            {
              title: t("quickCards.capacityTitle"),
              text: t("quickCards.capacityText"),
            },
            {
              title: t("quickCards.spaceTitle"),
              text: t("quickCards.spaceText"),
            },
            {
              title: t("quickCards.locationTitle"),
              text: t("quickCards.locationText"),
            },
            {
              title: t("quickCards.bookingTitle"),
              text: t("quickCards.bookingText"),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-3xl p-6 shadow-sm text-center"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400 mb-2">
                {item.title}
              </p>
              <p className="font-medium text-slate-800">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== RESERVA DIRECTA — VENTAJAS ============== */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="uppercase tracking-[0.3em] text-slate-500 mb-4">
            {t("directBooking.label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-10">
            {t("directBooking.title")}
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
            {[
              t("directBooking.perk1"),
              t("directBooking.perk2"),
              t("directBooking.perk3"),
              t("directBooking.perk4"),
              t("directBooking.perk5"),
            ].map((perk) => (
              <div
                key={perk}
                className="flex items-start gap-3 bg-[#f7f4ee] rounded-2xl p-5"
              >
                <span className="text-green-600 text-xl leading-none mt-1">
                  ✓
                </span>
                <p className="text-slate-800">{perk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== SERVICIOS / EQUIPAMIENTO ============== */}
      <section id="servicios" className="px-6 py-24 bg-[#f7f4ee]">
        <div className="max-w-6xl mx-auto">
          <p className="uppercase tracking-[0.3em] text-slate-500 mb-4">
            {t("amenities.label")}
          </p>

          <h2 className="text-4xl md:text-5xl font-semibold mb-10">
            {t("amenities.title")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-16">
            {[
              { icon: "📶", label: t("amenities.wifi") },
              { icon: "❄️", label: t("amenities.ac") },
              { icon: "🔥", label: t("amenities.heating") },
              { icon: "🍳", label: t("amenities.kitchen") },
              { icon: "☕", label: t("amenities.coffee") },
              { icon: "🧺", label: t("amenities.washer") },
              { icon: "🍽️", label: t("amenities.dishwasher") },
              { icon: "📺", label: t("amenities.tv") },
              { icon: "🌅", label: t("amenities.terrace") },
              { icon: "🛗", label: t("amenities.elevator") },
              { icon: "🚗", label: t("amenities.parking") },
              { icon: "🏖️", label: t("amenities.beach") },
            ].map((a) => (
              <div
                key={a.label}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-slate-800 text-sm">{a.label}</span>
              </div>
            ))}
          </div>

          <div id="galeria">
            <GalleryGrid />
          </div>
        </div>
      </section>

      {/* ============== UBICACIÓN ============== */}
      <section id="ubicacion" className="px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="uppercase tracking-[0.3em] text-slate-500 mb-4">
              {t("location.label")}
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6">
              {t("location.title")}
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              {t("location.description")}
            </p>
            <ul className="space-y-3 text-slate-700">
              <li>✓ {t("location.point1")}</li>
              <li>✓ {t("location.point2")}</li>
              <li>✓ {t("location.point3")}</li>
              <li>✓ {t("location.point4")}</li>
            </ul>
          </div>

          <div className="rounded-[2rem] overflow-hidden shadow-xl aspect-[4/3]">
            <iframe
              src={mapsEmbed}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("location.title")}
            ></iframe>
          </div>
        </div>
      </section>

      {/* ============== RESERVAR ============== */}
      <section id="reservar" className="px-6 py-24 bg-[#f7f4ee]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-[0.3em] text-slate-500 mb-4">
            {t("booking.label")}
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">
            {t("booking.title")}
          </h2>
          <p className="text-lg text-slate-700 mb-10">
            {t("booking.description")}
          </p>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm">
            <AvailabilityCalendar />

            <div className="grid md:grid-cols-3 gap-4 text-left mt-8">
              <div className="rounded-2xl bg-[#f7f4ee] p-5">
                <h3 className="font-semibold mb-2">
                  {t("booking.securePaymentTitle")}
                </h3>
                <p className="text-sm text-slate-600">
                  {t("booking.securePaymentText")}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f7f4ee] p-5">
                <h3 className="font-semibold mb-2">
                  {t("booking.instantTitle")}
                </h3>
                <p className="text-sm text-slate-600">
                  {t("booking.instantText")}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f7f4ee] p-5">
                <h3 className="font-semibold mb-2">
                  {t("booking.hostTitle")}
                </h3>
                <p className="text-sm text-slate-600">
                  {t("booking.hostText")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="px-6 py-12 bg-slate-900 text-white/80">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="font-semibold text-white mb-2">
              {propertyConfig.brand}
            </p>
            <p className="italic text-white/50">{t("footer.nickname")}</p>
            <p className="mt-2">
              {propertyConfig.city}, {propertyConfig.province},{" "}
              {propertyConfig.country}
            </p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">
              {t("footer.contactTitle")}
            </p>
            <p>
              {t("footer.whatsapp")}:{" "}
              <a href={waLink} className="hover:text-white">
                {propertyConfig.whatsappDisplay}
              </a>
            </p>
            {propertyConfig.email && (
              <p>
                {t("footer.email")}:{" "}
                <a
                  href={`mailto:${propertyConfig.email}`}
                  className="hover:text-white"
                >
                  {propertyConfig.email}
                </a>
              </p>
            )}
          </div>
          <div>
            <p className="font-semibold text-white mb-2">
              {t("footer.legalTitle")}
            </p>
            {propertyConfig.touristRegistrationNumber && (
              <p>
                Registro turístico:{" "}
                {propertyConfig.touristRegistrationNumber}
              </p>
            )}
            <p className="mt-2">
              © {new Date().getFullYear()} {propertyConfig.brand}.{" "}
              {t("footer.rights")}
            </p>
            <p className="mt-4">
              <a
                href="/admin"
                className="text-white/40 hover:text-white/70 transition text-xs"
              >
                {t("footer.ownerAccess")}
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ============== WHATSAPP FLOTANTE ============== */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-4 rounded-full shadow-xl font-medium hover:bg-green-700 transition"
        aria-label="WhatsApp"
      >
        WhatsApp
      </a>
    </main>
  );
}
