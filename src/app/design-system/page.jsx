import "../styles/design-system.css";

export const metadata = {
  title: "Design System | Pixel Pulse",
  description:
    "The Pixel Pulse design system — brand colors, typography, spacing, and component patterns.",
  robots: { index: false, follow: false },
};

const BRAND_COLORS = [
  { name: "Lime", varName: "--pp-lime", hex: "#a4cf5f" },
  { name: "Lime Bright", varName: "--pp-lime-bright", hex: "#b7dd5f" },
  { name: "Peach", varName: "--pp-peach", hex: "#fbae7b" },
  { name: "Peach Deep", varName: "--pp-peach-deep", hex: "#f7b27d" },
  { name: "Magenta", varName: "--pp-magenta", hex: "#ff2d78" },
];

const SURFACE_COLORS = [
  { name: "Background", varName: "--pp-bg", hex: "#0b0f14" },
  { name: "Background Deep", varName: "--pp-bg-deep", hex: "#050810" },
  { name: "Surface", varName: "--pp-surface", hex: "#111827" },
  { name: "Surface Soft", varName: "--pp-surface-soft", hex: "#1f2937" },
];

const TEXT_COLORS = [
  { name: "Text", varName: "--pp-text", hex: "#f8fafc" },
  { name: "Text Muted", varName: "--pp-text-muted", hex: "#cbd5e1" },
  { name: "Text Soft", varName: "--pp-text-soft", hex: "#94a3b8" },
  { name: "Text on Brand", varName: "--pp-text-on-brand", hex: "#050810" },
];

const GRADIENTS = [
  { name: "Brand line", varName: "--pp-gradient-brand" },
  { name: "Button", varName: "--pp-gradient-button" },
  { name: "Card", varName: "--pp-gradient-card" },
  { name: "Banner", varName: "--pp-gradient-banner" },
];

const TYPE_SCALE = [
  { label: "--pp-text-hero", size: "var(--pp-text-hero)" },
  { label: "--pp-text-h1", size: "var(--pp-text-h1)" },
  { label: "--pp-text-h2", size: "var(--pp-text-h2)" },
  { label: "--pp-text-h3", size: "var(--pp-text-h3)" },
  { label: "--pp-text-lead", size: "var(--pp-text-lead)", body: true },
  { label: "--pp-text-body", size: "var(--pp-text-body)", body: true },
  { label: "--pp-text-sm", size: "var(--pp-text-sm)", body: true },
];

const SPACING = [
  { label: "--pp-space-1 · 4px", w: "0.25rem" },
  { label: "--pp-space-2 · 8px", w: "0.5rem" },
  { label: "--pp-space-3 · 12px", w: "0.75rem" },
  { label: "--pp-space-4 · 16px", w: "1rem" },
  { label: "--pp-space-5 · 20px", w: "1.25rem" },
  { label: "--pp-space-6 · 24px", w: "1.5rem" },
  { label: "--pp-space-8 · 32px", w: "2rem" },
  { label: "--pp-space-10 · 40px", w: "2.5rem" },
  { label: "--pp-space-12 · 48px", w: "3rem" },
  { label: "--pp-space-16 · 64px", w: "4rem" },
];

const RADII = [
  { label: "sm · 8px", varName: "--pp-radius-sm" },
  { label: "md · 12px", varName: "--pp-radius-md" },
  { label: "lg · 16px", varName: "--pp-radius-lg" },
  { label: "xl · 24px", varName: "--pp-radius-xl" },
  { label: "pill", varName: "--pp-radius-pill" },
];

const SHADOWS = [
  { label: "--pp-shadow-soft", varName: "--pp-shadow-soft" },
  { label: "--pp-shadow-card", varName: "--pp-shadow-card" },
  { label: "--pp-shadow-lg", varName: "--pp-shadow-lg" },
  { label: "--pp-glow-lime", varName: "--pp-glow-lime" },
  { label: "--pp-glow-peach", varName: "--pp-glow-peach" },
];

function Swatch({ name, varName, hex }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch__chip" style={{ background: `var(${varName})` }} />
      <div className="ds-swatch__meta">
        <div className="ds-swatch__name">{name}</div>
        <div className="ds-swatch__var">{varName}</div>
        <div className="ds-swatch__hex">{hex}</div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className="ds-section">
      <h2 className="ds-section__title">{title}</h2>
      {hint ? <p className="ds-section__hint">{hint}</p> : null}
      <div className="ds-section__rule" />
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="ds-page">
      <div className="ds-shell">
        <header className="ds-header">
          <span className="ds-header__eyebrow">Brand reference</span>
          <h1 className="ds-header__title">
            Pixel Pulse <span>Design System</span>
          </h1>
          <p className="ds-header__lead">
            The single source of truth for Pixel Pulse&apos;s look. Every value below is a{" "}
            <code>--pp-*</code> token defined in{" "}
            <code>src/app/styles/design-tokens.css</code>. Prefer these tokens over
            hard-coded values in new CSS.
          </p>
        </header>

        <Section
          title="Brand Colors"
          hint="The lime + peach + magenta core. Lime and peach drive CTAs; magenta is the accent in the brand gradient line."
        >
          <div className="ds-grid">
            {BRAND_COLORS.map((c) => (
              <Swatch key={c.varName} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Surfaces & Neutrals" hint="Backgrounds and card surfaces, dark-first.">
          <div className="ds-grid">
            {SURFACE_COLORS.map((c) => (
              <Swatch key={c.varName} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Text" hint="Foreground colors. Use Text on Brand for dark text over lime/peach fills.">
          <div className="ds-grid">
            {TEXT_COLORS.map((c) => (
              <Swatch key={c.varName} {...c} />
            ))}
          </div>
        </Section>

        <Section title="Gradients" hint="Reusable brand gradients.">
          <div className="ds-grid">
            {GRADIENTS.map((g) => (
              <div className="ds-gradient" key={g.varName}>
                <div className="ds-gradient__band" style={{ background: `var(${g.varName})` }} />
                <div className="ds-gradient__meta">
                  {g.name}
                  <br />
                  {g.varName}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" hint="Barlow Condensed for display, DM Sans for body.">
          <div className="ds-fonts">
            <div className="ds-font-card">
              <div className="ds-font-card__display" style={{ fontFamily: "var(--pp-font-display)" }}>
                Aa
              </div>
              <div className="ds-font-card__name">Barlow Condensed</div>
              <div className="ds-font-card__meta">Display · 600 / 800 · --pp-font-display</div>
            </div>
            <div className="ds-font-card">
              <div className="ds-font-card__display" style={{ fontFamily: "var(--pp-font-body)" }}>
                Aa
              </div>
              <div className="ds-font-card__name">DM Sans</div>
              <div className="ds-font-card__meta">Body · 400 / 500 / 600 · --pp-font-body</div>
            </div>
          </div>

          {TYPE_SCALE.map((t) => (
            <div className={`ds-type-row${t.body ? " ds-type-row--body" : ""}`} key={t.label}>
              <span className="ds-type-row__label">{t.label}</span>
              <span className="ds-type-row__sample" style={{ fontSize: t.size }}>
                Step inside the game
              </span>
            </div>
          ))}
        </Section>

        <Section title="Spacing" hint="4px-based scale for padding, margins, and gaps.">
          {SPACING.map((s) => (
            <div className="ds-space-row" key={s.label}>
              <div className="ds-space-row__bar" style={{ width: s.w }} />
              <span className="ds-space-row__label">{s.label}</span>
            </div>
          ))}
        </Section>

        <Section title="Radius" hint="Corner radii from subtle to pill.">
          <div className="ds-grid">
            {RADII.map((r) => (
              <div
                className="ds-tile"
                key={r.varName}
                style={{ borderRadius: `var(${r.varName})` }}
              >
                {r.label}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadows & Glows" hint="Elevation and neon brand glows.">
          <div className="ds-grid">
            {SHADOWS.map((s) => (
              <div className="ds-shadow-tile" key={s.varName} style={{ boxShadow: `var(${s.varName})` }}>
                {s.label}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons" hint="Primary gradient pill, peach outline, ghost, and the dark inline CTA.">
          <div className="ds-cluster">
            <button type="button" className="ds-btn ds-btn--primary">
              Book Now
            </button>
            <button type="button" className="ds-btn ds-btn--secondary">
              Contact Us
            </button>
            <button type="button" className="ds-btn ds-btn--ghost">
              Learn More
            </button>
            <button type="button" className="ds-btn ds-btn--dark">
              Book Now
            </button>
          </div>
        </Section>

        <Section title="Badges & Cards" hint="Eyebrow chip and the brand content card with gradient top stripe.">
          <div className="ds-cluster" style={{ marginBottom: "var(--pp-space-6)" }}>
            <span className="ds-eyebrow">Pixel Pulse · Vaughan</span>
            <span className="ds-eyebrow">New</span>
          </div>
          <div className="ds-demo-card">
            <span className="ds-eyebrow">Featured</span>
            <h3 className="ds-demo-card__title">Challenge Rooms</h3>
            <p className="ds-demo-card__text">
              Immersive, glowing arenas built for teams, birthdays, and weekend
              missions.
            </p>
          </div>
        </Section>

        <Section title="Promo Banner" hint="The lime-gradient promotional strip used across pricing & promos.">
          <div className="ds-banner">
            <div>
              <p className="ds-banner__title">Weekday Birthday Deal</p>
              <span className="ds-banner__sub">Save $50 when you book Mon-Thu</span>
            </div>
            <button type="button" className="ds-btn ds-btn--dark">
              Book Now
            </button>
          </div>
        </Section>
      </div>
    </main>
  );
}
