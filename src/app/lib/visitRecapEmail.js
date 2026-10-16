function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function renderVisitRecapEmail(recap, firstName = "") {
  if (!recap) return "";
  const { summary, url } = recap;
  const hasScores = summary.challengesPlayed > 0;
  const stats = [
    ["Total score", hasScores ? Number(summary.totalPoints).toLocaleString("en-CA") : "—"],
    ["Players", (summary.players?.length || 0).toLocaleString("en-CA")],
    ["Highest score", hasScores && summary.bestScore ? Number(summary.bestScore.points).toLocaleString("en-CA") : "—"],
  ];
  return `
    <div style="margin:0 0 26px;background:#111a28;border-radius:14px;text-align:center;color:#ffffff;">
      <img src="https://pixelpulseplay.ca/assets/images/visit-recap-hero.jpg" alt="Players taking on the illuminated challenge room at Pixel Pulse" width="632" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:14px 14px 0 0;" />
      <div style="padding:24px 18px;">
      <p style="margin:0 0 8px;color:#b9eb73;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your Pixel Pulse recap</p>
      <h2 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#ffffff;">${hasScores ? `${firstName ? `Hey ${escape(firstName)}, your` : "Your"} scores &amp; stats are ready!` : "Thanks for bringing your energy!"}</h2>
      <p style="margin:0 0 18px;color:#d4dce7;">${hasScores ? "Take another look at your visit and see how you did." : "Your visit recap is here. No recorded scores were available when it was created."}</p>
      ${summary.visitDate ? `<p style="margin:0 0 18px;color:#d4dce7;">Visit: ${escape(summary.visitDate)}</p>` : ""}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ffffff24;border-bottom:1px solid #ffffff24;"><tr>${stats.map(([label, value]) => `<td width="33%" style="padding:18px 3px;vertical-align:top;"><strong style="display:block;font-size:26px;line-height:1.2;color:#b9eb73;">${value}</strong><span style="font-size:12px;color:#d4dce7;">${label}</span></td>`).join("")}</tr></table>
      ${hasScores ? `<p style="margin:10px 0 0;font-size:11px;color:#9aa8bb;">Highest score is the best single challenge result.</p>` : ""}
      <p style="margin:22px 0 0;"><a href="${escape(url)}" style="display:inline-block;padding:15px 22px;border-radius:8px;background:#b9eb73;color:#111a28;font-weight:800;text-decoration:none;">${hasScores ? "See Your Scores &amp; Stats" : "View Your Visit Recap"}</a></p>
      </div>
    </div>`;
}

export function visitRecapEmailText(recap) {
  if (!recap) return "";
  const { summary, url } = recap;
  return ["Your Pixel Pulse Visit Recap", summary.visitDate ? `Visit: ${summary.visitDate}` : "",
    `Players: ${summary.players?.length || 0}`,
    ...(summary.challengesPlayed ? [`Total score: ${summary.totalPoints}`, `Highest score (single challenge): ${summary.bestScore?.points ?? "Not available"}`] : ["No recorded scores were available when this recap was created."]),
    `See your visit recap: ${url}`].filter(Boolean).join("\n");
}
