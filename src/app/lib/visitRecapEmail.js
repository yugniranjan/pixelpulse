function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function renderVisitRecapEmail(recap, firstName = "") {
  if (!recap) return "";
  const { summary, url } = recap;
  const hasScores = summary.challengesPlayed > 0;
  const stats = [["Total points", summary.totalPoints], ["Challenges played", summary.challengesPlayed], ["Games explored", summary.gamesExplored]];
  return `
    <div style="margin:0 0 26px;padding:24px 18px;background:#111a28;border-radius:14px;text-align:center;color:#ffffff;">
      <p style="margin:0 0 8px;color:#b9eb73;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your Pixel Pulse recap</p>
      <h2 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#ffffff;">${hasScores ? `${firstName ? `Hey ${escape(firstName)}, your` : "Your"} scores &amp; stats are ready!` : "Thanks for bringing your energy!"}</h2>
      <p style="margin:0 0 18px;color:#d4dce7;">${hasScores ? "Take another look at your visit and see how you did." : "Keep your visit recap handy and come back for your next challenge."}</p>
      ${summary.visitDate ? `<p style="margin:0 0 18px;color:#d4dce7;">Visit: ${escape(summary.visitDate)}</p>` : ""}
      ${hasScores ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${stats.map(([label, value]) => `<td width="33%" style="padding:12px 3px;vertical-align:top;"><strong style="display:block;font-size:26px;line-height:1.2;color:#b9eb73;">${Number(value).toLocaleString("en-CA")}</strong><span style="font-size:12px;color:#d4dce7;">${label}</span></td>`).join("")}</tr></table>` : ""}
      <p style="margin:22px 0 0;"><a href="${escape(url)}" style="display:inline-block;padding:15px 22px;border-radius:8px;background:#b9eb73;color:#111a28;font-weight:800;text-decoration:none;">${hasScores ? "See Your Scores &amp; Stats" : "View Your Visit Recap"}</a></p>
    </div>`;
}

export function visitRecapEmailText(recap) {
  if (!recap) return "";
  const { summary, url } = recap;
  return ["Your Pixel Pulse Visit Recap", summary.visitDate ? `Visit: ${summary.visitDate}` : "",
    ...(summary.challengesPlayed ? [`Total points: ${summary.totalPoints}`, `Challenges played: ${summary.challengesPlayed}`, `Games explored: ${summary.gamesExplored}`] : []),
    `See your visit recap: ${url}`].filter(Boolean).join("\n");
}
