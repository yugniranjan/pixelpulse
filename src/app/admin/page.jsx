import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import "../styles/admin-waivers.css";

const adminCards = [
  {
    title: "Waivers",
    description: "Review submitted waivers, family members, party IDs, signatures, and visit details.",
    href: "/admin/waivers",
    action: "Manage Waivers",
  },
  {
    title: "Invites",
    description: "Create birthday invite links, waiver links, SMS copy, and QR codes for party guests.",
    href: "/admin/invites",
    action: "Build Invites",
  },
  {
    title: "Blogs",
    description: "Create, edit, publish, and remove Pixel Pulse blog posts and website updates.",
    href: "/admin/blogs",
    action: "Manage Blogs",
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="waiver-admin-header waiver-admin-header--dashboard">
        <div>
          <span className="waiver-admin-kicker">Admin dashboard</span>
          <h1>Pixel Pulse Admin</h1>
          <p>Manage waivers, party invites, and blog content from one place.</p>
        </div>
      </div>

      <div className="admin-home-grid">
        {adminCards.map((card) => (
          <article className="admin-home-card" key={card.href}>
            <div>
              <span>{card.title}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
            <Link href={card.href}>{card.action}</Link>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
