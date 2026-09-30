import Link from "next/link";
import { brandList } from "@/config/brands";
import { ConsentPreferences } from "@/components/site/ConsentBanner";
import { DirectWhatsAppLink } from "@/components/site/WhatsApp";
import { analyticsConfigured } from "@/lib/analytics";
import { homeLooks } from "./looks";

const linkClasses =
  "inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 hover:decoration-4";

/**
 * Pie de la portada: acceso a las dos marcas, con su Instagram y su WhatsApp
 * directo por separado. No usa SiteFooter porque ese pie ofrece "Volver a
 * elegir el tipo de evento", que en la portada apuntaría a la misma página.
 */
export function HomeFooter() {
  return (
    <footer className="border-t border-[rgb(58_45_92/0.14)]">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 px-4 pb-12 pt-10 sm:grid-cols-2 sm:px-6 lg:pb-14">
        {brandList.map((brand) => (
          <section key={brand.id} aria-labelledby={`pie-${brand.id}`}>
            <h2 id={`pie-${brand.id}`} className={`text-xl ${homeLooks[brand.id].nameFont}`}>
              {brand.name}
            </h2>
            <ul className="mt-2 flex flex-col">
              <li>
                <Link
                  href={brand.path}
                  data-brand-choice={brand.id}
                  data-choice-location="pie"
                  className={linkClasses}
                >
                  Ir a {brand.name}
                </Link>
              </li>
              {brand.instagram ? (
                <li>
                  <a
                    href={brand.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClasses}
                  >
                    Instagram @{brand.instagram.handle}
                  </a>
                </li>
              ) : null}
            </ul>
            <div className="mt-3">
              <DirectWhatsAppLink
                brandId={brand.id}
                location="portada-pie"
                label={`WhatsApp de ${brand.name}`}
              />
            </div>
          </section>
        ))}
        {analyticsConfigured ? (
          <div className="sm:col-span-2">
            <ConsentPreferences />
          </div>
        ) : null}
      </div>
    </footer>
  );
}
