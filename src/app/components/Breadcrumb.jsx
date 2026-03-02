"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname) return null;

  const pathSegments = pathname.split("/").filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");

    return {
      label: formatLabel(segment),
      href,
    };
  });

  function formatLabel(slug) {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${process.env.NEXT_PUBLIC_SITE_URL || ""}${crumb.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {
        breadcrumbs.length > 0 && <section className="breadcrumb-container">
        <nav aria-label="Breadcrumb" className="breadcrumb aero-max-container">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={crumb.href} aria-current={isLast ? "page" : undefined}>
                  {isLast ? (
                    crumb.label
                  ) : (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </section>
      }
      
    </>
  );
}
