// app/legal/cookies/page.tsx
// ============================================================
// Política de Cookies
// Texto generado con textos-legales.edgartamarit.com (22/05/2026)
// adaptado a los datos de A escasos metros del mar.
// ============================================================

import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Cookies | A escasos metros del mar",
  description:
    "Información sobre el uso de cookies en el sitio web A escasos metros del mar.",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="22 de mayo de 2026">
      <p>
        El acceso a este Sitio Web puede implicar la utilización de cookies. Las
        cookies son pequeñas cantidades de información que se almacenan en el
        navegador utilizado por cada Usuario —en los distintos dispositivos que
        pueda utilizar para navegar— para que el servidor recuerde cierta
        información que posteriormente, y únicamente el servidor que la
        implementó, leerá. Las cookies facilitan la navegación, la hacen más
        amigable, y no dañan el dispositivo de navegación.
      </p>
      <p>
        Las cookies son procedimientos automáticos de recogida de información
        relativa a las preferencias determinadas por el Usuario durante su
        visita al Sitio Web, con el fin de reconocerlo como Usuario y
        personalizar su experiencia. Ninguna cookie permite contactar con el
        número de teléfono del Usuario ni con cualquier otro medio de contacto
        personal. Ninguna cookie puede extraer información del disco duro del
        Usuario o robar información personal.
      </p>
      <p>
        Las cookies que permiten identificar a una persona se consideran datos
        personales. Por tanto, les será de aplicación la Política de Privacidad.
        Para su utilización será necesario el consentimiento del Usuario.
      </p>

      <h2 className="text-xl font-semibold text-slate-900 pt-4">
        Cookies propias
      </h2>
      <p>
        Son aquellas cookies que son enviadas al ordenador o dispositivo del
        Usuario y gestionadas exclusivamente por A escasos metros del mar para
        el mejor funcionamiento del Sitio Web. La información que se recaba se
        emplea para mejorar la calidad del Sitio Web y su contenido, y la
        experiencia como Usuario.
      </p>

      <h2 className="text-xl font-semibold text-slate-900 pt-4">
        Cookies de terceros
      </h2>
      <p>
        Son cookies utilizadas y gestionadas por entidades externas que
        proporcionan a A escasos metros del mar servicios solicitados por este
        mismo para mejorar el Sitio Web y la experiencia del usuario. Los
        principales objetivos para los que se utilizan son la obtención de
        estadísticas de accesos y el análisis de la información de la
        navegación. En todo caso, la información se recopila de forma anónima y
        se elaboran informes de tendencias del Sitio Web sin identificar a
        usuarios individuales.
      </p>
      <p>
        Puede obtener más información sobre las cookies, la privacidad, o
        consultar la descripción del tipo de cookies que se utiliza, sus
        principales características y periodo de expiración, en los siguientes
        enlaces:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Vercel Inc. (Vercel Analytics y Speed Insights). Información sobre sus
          cookies:{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 underline"
          >
            https://vercel.com/legal/privacy-policy
          </a>
        </li>
        <li>
          Stripe Payments Europe, Ltd. (procesamiento de pagos). Información
          sobre sus cookies:{" "}
          <a
            href="https://stripe.com/es/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 underline"
          >
            https://stripe.com/es/privacy
          </a>
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900 pt-4">
        Deshabilitar, rechazar y eliminar cookies
      </h2>
      <p>
        El Usuario puede deshabilitar, rechazar y eliminar las cookies —total o
        parcialmente— instaladas en su dispositivo mediante la configuración de
        su navegador (Chrome, Firefox, Safari, Explorer, entre otros). Los
        procedimientos para rechazar y eliminar las cookies pueden diferir de un
        navegador de Internet a otro, por lo que el Usuario debe acudir a las
        instrucciones facilitadas por el propio navegador. En el supuesto de que
        rechace el uso de cookies —total o parcialmente— podrá seguir usando el
        Sitio Web, si bien podrá tener limitada la utilización de algunas de sus
        prestaciones.
      </p>
    </LegalLayout>
  );
}
