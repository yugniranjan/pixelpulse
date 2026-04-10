import Link from "next/link";

const FloatingWaiverButton = ({ waiverLink }) => {
  if (!waiverLink) {
    return null;
  }

  return (
    <Link
      href={waiverLink}
      target="_blank"
      rel="noopener noreferrer"
      className="ppp-floating-waiver"
      prefetch={false}
    >
      <span className="ppp-floating-waiver__eyebrow">Required</span>
      <span className="ppp-floating-waiver__label">Sign Waiver</span>
    </Link>
  );
};

export default FloatingWaiverButton;
