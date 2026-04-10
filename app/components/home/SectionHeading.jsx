export default function SectionHeading({ children, className = "", mainHeading = false }) {
  return mainHeading ? <h1 className={`section-heading section-heading-main ${className}`}>{children}</h1> : <h2 className={`section-heading ${className}`}>{children}</h2>;
}
