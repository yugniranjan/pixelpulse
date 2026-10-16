export function getPlayerStandings(players = []) {
  const sorted = [...players].sort((a, b) =>
    Number(b.challenges > 0) - Number(a.challenges > 0) || b.points - a.points,
  );
  const scored = sorted.filter((player) => player.challenges > 0);
  const topScore = scored[0]?.points;
  const winners = scored.filter((player) => player.points === topScore).length;
  let rank = 0;
  return sorted.map((player, index) => {
    const hasScore = player.challenges > 0;
    if (hasScore && (index === 0 || player.points !== sorted[index - 1].points)) rank = index + 1;
    return {
      ...player,
      rank: hasScore ? rank : null,
      isWinner: hasScore && player.points === topScore,
      winnerLabel: winners > 1 ? "Joint winner" : "Winner",
    };
  });
}

export function summarizeVisit(rows = []) {
  const players = new Map();
  const games = new Map();
  let totalPoints = 0;
  let bestScore = null;

  for (const row of rows) {
    if (!players.has(String(row.player_id))) {
      players.set(String(row.player_id), { name: row.first_name || "Player", points: 0, challenges: 0 });
    }
    if (row.score_id == null) continue;
    const points = Number(row.points) || 0;
    totalPoints += points;
    const player = players.get(String(row.player_id));
    player.points += points;
    player.challenges += 1;
    const key = String(row.game_id);
    if (!games.has(key)) games.set(key, { name: row.game_name || "Challenge", points: 0, plays: 0, best: points });
    const game = games.get(key);
    game.points += points;
    game.plays += 1;
    game.best = Math.max(game.best, points);
    if (!bestScore || points > bestScore.points) bestScore = { points, game: game.name, player: player.name };
  }

  return {
    visitDate: rows[0]?.visit_date || "",
    totalPoints,
    challengesPlayed: [...games.values()].reduce((sum, game) => sum + game.plays, 0),
    gamesExplored: games.size,
    bestScore,
    players: [...players.values()].sort((a, b) => b.points - a.points),
    games: [...games.values()].sort((a, b) => b.points - a.points),
  };
}
