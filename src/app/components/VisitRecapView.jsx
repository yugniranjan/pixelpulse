import Link from "next/link";
import Image from "next/image";
import { getPlayerStandings } from "../lib/visitRecapSummary.mjs";

const number = (value) => Number(value).toLocaleString("en-CA");

export default function VisitRecapView({ recap }) {
  const hasScores = recap?.challengesPlayed > 0;
  const standings = getPlayerStandings(recap?.players);
  const greetingName = recap?.recipientName || (recap?.players?.length === 1 ? recap.players[0].name : "crew");
  const date = recap?.visitDate ? new Date(`${recap.visitDate}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Toronto" }) : "";

  return (
    <main className="visit-recap">
      <nav className="visit-recap__nav" aria-label="Pixel Pulse">
        <Link href="/" className="visit-recap__brand" aria-label="Pixel Pulse home">
          <Image src="/assets/images/logoD.png" alt="Pixel Pulse Play N Party" width={5000} height={2000} className="visit-recap__logo" priority />
        </Link>
      </nav>
      <div className="visit-recap__shell">
        <header className="visit-recap__hero">
          <p className="visit-recap__eyebrow">GOOD TIMES. GREAT CHALLENGES.</p>
          <h1>{recap ? <>What a game, {greetingName}!<span>Here’s how you scored.</span></> : <>Let’s find your<span>visit recap.</span></>}</h1>
          <p>{recap ? "Every challenge. Every point. Every win. Here’s a look at your Pixel Pulse Play adventure!" : "This recap link is invalid or has expired. Contact our team for help with your results."}</p>
          {date && <p className="visit-recap__date">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></svg>
            <span>{date} <span aria-hidden="true">·</span> Pixel Pulse Play</span>
          </p>}
        </header>

        {recap && <>
          {hasScores ? <>
            <section className="visit-recap__stats" aria-label="Visit statistics">
              {[["Points earned", recap.totalPoints], ["Challenges played", recap.challengesPlayed], ["Games explored", recap.gamesExplored]].map(([label, value]) => <div key={label}><strong>{number(value)}</strong><span>{label}</span></div>)}
            </section>
            <section className="visit-recap__players" aria-label="Player leaderboard">
              <p className="visit-recap__eyebrow">YOUR CREW’S LEADERBOARD</p>
              <h2>Who&apos;s leading the pack?</h2>
              <p>See how everyone in your crew scored. Who claimed the top spot, and who&apos;s ready for a rematch?</p>
              <div>{standings.map((player, index) => (
                <article key={index} className={player.isWinner ? "visit-recap__player--winner" : undefined}>
                  <div className="visit-recap__player-heading">
                    <span className="visit-recap__player-rank">{player.rank ? `#${player.rank}` : "—"}</span>
                    {player.isWinner && <span className="visit-recap__winner-badge">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2 6l5 4 5-7 5 7 5-4-3 12H5L2 6zm3 14h14v2H5z" /></svg>
                      {player.winnerLabel}
                    </span>}
                  </div>
                  <h3>{player.name}</h3>
                  <strong>{number(player.points)} <small>points</small></strong>
                  <p>{player.challenges > 0 ? `${player.challenges} challenges played` : "No recorded scores"}</p>
                </article>
              ))}</div>
            </section>
            <section className="visit-recap__best" aria-label="Visit highlight">
              <span>PERSONAL HIGHLIGHT</span><h2>{recap.bestScore.game}</h2>
              <p><strong>{number(recap.bestScore.points)} points</strong> · Your highest single challenge score{recap.players.length > 1 ? `, played by ${recap.bestScore.player}` : ""}.</p>
            </section>
            <section id="scores" className="visit-recap__scores">
              <p className="visit-recap__eyebrow">THE SCORECARD</p><h2>Every challenge counts.</h2>
              <p>Scores from this visit, grouped by game. Each recorded player challenge counts as one play.</p>
              <div className="visit-recap__table"><table><thead><tr><th scope="col">Game</th><th scope="col">Plays</th><th scope="col">Best score</th><th scope="col">Total points</th></tr></thead><tbody>
                {recap.games.map((game, index) => <tr key={index}><th scope="row">{game.name}</th><td>{number(game.plays)}</td><td>{number(game.best)}</td><td>{number(game.points)}</td></tr>)}
              </tbody></table></div>
            </section>
          </> : <section id="scores" className="visit-recap__empty"><h2>Thanks for playing with us.</h2><p>No recorded scores were available when this recap was created. If you expected results, our team can help.</p><a href="mailto:connect@pixelpulseplay.ca">Contact Pixel Pulse ↗</a></section>}
        </>}

        <div className="visit-recap__booking-cta">
          <Link href="/booking?type=ticket" className="visit-recap__booking">Book Your Next Visit <span aria-hidden="true">↗</span></Link>
        </div>
        <footer className="visit-recap__footer"><span>Pixel Pulse Play Zone · Vaughan, Ontario</span><a href="mailto:connect@pixelpulseplay.ca">Need a hand? Contact us</a></footer>
      </div>
    </main>
  );
}

