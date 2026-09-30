import Link from "next/link";
import type { ReactNode } from "react";
import { brandList, getBrand } from "@/config/brands";
import type { BrandId } from "@/lib/types";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ConsentPreferences } from "./ConsentBanner";
import { DirectWhatsAppLink } from "./WhatsApp";

/**
 * Envoltorio de cada ruta de marca: aplica el tema con data-brand y agrega
 * header y footer. El header siempre ofrece volver a la elección de marca.
 */
export function BrandShell({
  brandId,
  children,
  compactHeader = false,
}: {
  brandId: BrandId;
  children: ReactNode;
  /** En el configurador el header es más bajo y no repite el WhatsApp. */
  compactHeader?: boolean;
}) {
  return (
    <div data-brand={brandId} className="flex min-h-dvh flex-col bg-bg text-ink">
      <SiteHeader brandId={brandId} compact={compactHeader} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter brandId={brandId} />
    </div>
  );
}

export function SiteHeader({ brandId, compact }: { brandId: BrandId; compact: boolean }) {
  const brand = getBrand(brandId);
  const isNight = brandId === "noche-magik";
  return (
    // Noche Magik usa una barra clara, "luz de luna": el nombre de su logo es
    // azul oscuro y sobre la noche no se leería. Sobre esa barra el foco dorado
    // no se ve (1,5:1), así que ahí el contorno es azul noche (16:1).
    <header
      className={`border-b ${
        isNight ? "border-transparent bg-moon text-[#0b1630] [--focus:#0b1630]" : "border-line bg-surface"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link
          href={brand.path}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg"
          aria-label={`${brand.name}: inicio`}
        >
          <BrandLogo logo={brand.logos.compact} height={isNight ? 60 : 46} priority />
        </Link>
        <nav aria-label="Navegación del sitio" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-base font-semibold underline decoration-2 underline-offset-4 hover:decoration-4 ${
              isNight ? "text-[#0b1630]" : "text-ink"
            }`}
          >
            Cambiar de marca
          </Link>
          {!compact ? (
            <span className="hidden sm:inline-flex">
              <DirectWhatsAppLink brandId={brandId} location="header" label="WhatsApp" />
            </span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ brandId }: { brandId?: BrandId }) {
  const current = brandId ? getBrand(brandId) : null;
  const others = brandList.filter((b) => b.id !== brandId);
  return (
    <footer data-sin-flotante className="border-t border-line bg-bg-soft">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          {/* Young Serif tiene un solo peso: en Noche Magik el nombre va en peso normal. */}
          <p className={`font-display text-xl ${brandId === "noche-magik" ? "font-normal" : "font-semibold"}`}>
            {current ? current.name : "Daale y Noche Magik"}
          </p>
          {current?.instagram ? (
            <p className="mt-2">
              <a
                href={current.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4"
              >
                Instagram @{current.instagram.handle}
              </a>
            </p>
          ) : null}
          {current ? (
            <div className="mt-3">
              <DirectWhatsAppLink brandId={current.id} location="footer" />
            </div>
          ) : null}
          <ConsentPreferences className="mt-3" />
        </div>
        <nav aria-label="Otras experiencias" className="sm:col-span-2">
          <p className="font-semibold">Ver otras experiencias</p>
          <ul className="mt-2 flex flex-col gap-1">
            {current ? (
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                  Volver a elegir el tipo de evento
                </Link>
              </li>
            ) : null}
            {others.map((b) => (
              <li key={b.id}>
                <Link href={b.path} className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                  {b.name}: {b.chooserLine.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
