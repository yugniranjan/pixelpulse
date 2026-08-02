"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/waivers", label: "Player Info" },
  { href: "/admin/invites", label: "Create Party Links" },
  { href: "/admin/gift-cards", label: "Gift Cards" },
  { href: "/admin/thank-you", label: "Thank You Email" },
  { href: "/admin/squad-referrals", label: "Squad Referrals" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/waiver-data", label: "Players Data" },
];

function shouldUseDocumentNavigation(href) {
  return href.startsWith("/admin/blogs");
}

function isActiveLink(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  if (href === "/admin/blogs") {
    return pathname === "/admin/blog" || pathname.startsWith("/admin/blogs");
  }

  // Keep "Player Info" from staying active on the nested reports route.
  if (href === "/admin/waivers") {
    return pathname === "/admin/waivers";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }) {
  const pathname = usePathname();

  return (
    <main className="waiver-dashboard-shell">
      <aside className="waiver-dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="waiver-dashboard-brand">
          <img src="/assets/images/logo.png" alt="Pixel Pulse Play" />
          <span>Admin</span>
        </div>
        <nav>
          {ADMIN_LINKS.map((link) => {
            const className = isActiveLink(pathname, link.href) ? "is-active" : "";

            if (shouldUseDocumentNavigation(link.href)) {
              return (
                <a className={className} href={link.href} key={link.href}>
                  {link.label}
                </a>
              );
            }

            return (
              <Link className={className} href={link.href} key={link.href}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="waiver-admin-page waiver-admin-page--dashboard">
        {children}
      </section>
    </main>
  );
}
