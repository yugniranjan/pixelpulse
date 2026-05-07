"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/waivers", label: "Waivers" },
  { href: "/admin/invites", label: "Create Party Links" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/waiver-data", label: "Players Data" },
];

function isActiveLink(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  if (href === "/admin/blogs") {
    return pathname === "/admin/blog" || pathname.startsWith("/admin/blogs");
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
          {ADMIN_LINKS.map((link) => (
            <Link
              className={isActiveLink(pathname, link.href) ? "is-active" : ""}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="waiver-admin-page waiver-admin-page--dashboard">
        {children}
      </section>
    </main>
  );
}
