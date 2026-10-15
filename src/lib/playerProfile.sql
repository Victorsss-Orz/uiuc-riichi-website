-- BLOCK season_stats
SELECT p.id, p.player_name AS name, p.rate, COALESCE(d.ranking, 0) AS rank_index,
    COALESCE(d.points, 0) AS points, COUNT(*) AS games,
    SUM(gp.placement = 1) AS firsts, SUM(gp.placement = 2) AS seconds,
    SUM(gp.placement = 3) AS thirds, SUM(gp.placement = 4) AS fourths,
    AVG(gp.placement) AS average_placement,
    RANK() OVER (ORDER BY CASE WHEN :sort = 'rate' THEN FLOOR(p.rate + 0.5)
        ELSE COALESCE(d.points, 0) END DESC) AS position
FROM games g
JOIN game_players gp ON gp.game_id = g.id
JOIN players p ON p.id = gp.player_id
LEFT JOIN player_semester_data d ON d.player_id = p.id AND d.semester = :semester
WHERE g.semester = :semester AND NOT g.is_team_game
GROUP BY p.id, p.player_name, p.rate, d.ranking, d.points;

-- BLOCK search_stats
WITH ranked AS (
    SELECT p.id, p.player_name AS name, p.rate, COALESCE(d.ranking, 0) AS rank_index,
        COALESCE(d.points, 0) AS points,
        RANK() OVER (ORDER BY CASE WHEN :sort = 'rate' THEN FLOOR(p.rate + 0.5)
            ELSE COALESCE(d.points, 0) END DESC) AS position
    FROM players p
    LEFT JOIN player_semester_data d ON d.player_id = p.id AND d.semester = :semester
    WHERE EXISTS (
        SELECT 1 FROM game_players gp JOIN games g ON g.id = gp.game_id
        WHERE gp.player_id = p.id AND g.semester = :semester AND NOT g.is_team_game
    )
), selected AS (
    SELECT * FROM ranked
    WHERE name LIKE :pattern ESCAPE '!'
    ORDER BY (name = :term) DESC, (name LIKE :prefix ESCAPE '!') DESC, name, id
    LIMIT 51
)
SELECT p.id, p.name, p.rate, p.rank_index, p.points, p.position,
    COUNT(*) AS games, SUM(gp.placement = 1) AS firsts,
    SUM(gp.placement = 2) AS seconds, SUM(gp.placement = 3) AS thirds,
    SUM(gp.placement = 4) AS fourths, AVG(gp.placement) AS average_placement
FROM selected p
JOIN game_players gp ON gp.player_id = p.id
JOIN games g ON g.id = gp.game_id
WHERE g.semester = :semester AND NOT g.is_team_game
GROUP BY p.id, p.name, p.rate, p.rank_index, p.points, p.position
ORDER BY (p.name = :term) DESC, (p.name LIKE :prefix ESCAPE '!') DESC, p.name, p.id;

-- BLOCK player
SELECT p.id, p.player_name, p.rate, p.rate_games,
    COALESCE(d.ranking, 0) AS rank_index, COALESCE(d.points, 0) AS points,
    s.games, s.average_placement, s.highest_score, s.average_score,
    CASE WHEN s.games = 0 THEN NULL ELSE (SELECT COUNT(*) + 1 FROM players other
     LEFT JOIN player_semester_data od ON od.player_id = other.id AND od.semester = :semester
     WHERE COALESCE(od.points, 0) > COALESCE(d.points, 0) AND EXISTS (
         SELECT 1 FROM game_players gp JOIN games g ON g.id = gp.game_id
         WHERE gp.player_id = other.id AND g.semester = :semester AND NOT g.is_team_game
     )) END AS campus_rank
FROM players p
LEFT JOIN player_semester_data d ON d.player_id = p.id AND d.semester = :semester
CROSS JOIN (
    SELECT COUNT(*) AS games, AVG(gp.placement) AS average_placement,
        MAX(gp.score) AS highest_score, AVG(gp.score) AS average_score
    FROM game_players gp JOIN games g ON g.id = gp.game_id
    WHERE gp.player_id = :player_id AND g.semester = :semester AND NOT g.is_team_game
) s
WHERE p.id = :player_id;

-- BLOCK recent
SELECT gp.placement FROM game_players gp JOIN games g ON g.id = gp.game_id
WHERE gp.player_id = :player_id AND g.semester = :semester AND NOT g.is_team_game
ORDER BY g.id DESC LIMIT :limit;

-- BLOCK opponents
SELECT p.id, p.player_name AS name, COUNT(*) AS meetings,
    SUM(me.placement < opponent.placement) AS wins,
    SUM(me.placement = opponent.placement) AS ties,
    AVG(me.placement) AS my_average, AVG(opponent.placement) AS opponent_average,
    SUM(CAST(opponent.point_change AS DECIMAL(20,4)) - CAST(me.point_change AS DECIMAL(20,4))) AS rivalry_pt,
    100 * SUM((CAST(opponent.point_change AS DECIMAL(20,4)) - CAST(me.point_change AS DECIMAL(20,4))) /
      (ABS(CAST(opponent.point_change AS DECIMAL(20,4)) - CAST(me.point_change AS DECIMAL(20,4))) + 60))
      / (COUNT(*) + 10) AS rivalry_index
FROM game_players me
JOIN games g ON g.id = me.game_id
JOIN game_players opponent ON opponent.game_id = g.id AND opponent.player_id <> me.player_id
JOIN players p ON p.id = opponent.player_id
WHERE me.player_id = :player_id AND NOT g.is_team_game
GROUP BY p.id, p.player_name;

-- BLOCK history
SELECT gp.*, g.game_time, g.is_team_game, p.player_name
FROM (
    SELECT g.id FROM games g
    JOIN game_players gp ON gp.game_id = g.id
    WHERE gp.player_id = :player_id AND g.semester = :semester AND NOT g.is_team_game
    ORDER BY g.game_time DESC, g.id DESC LIMIT :limit OFFSET :offset
) selected
JOIN games g ON g.id = selected.id
JOIN game_players gp ON gp.game_id = g.id
JOIN players p ON p.id = gp.player_id
ORDER BY g.game_time DESC, g.id DESC, gp.placement, gp.player_id;

-- BLOCK history_count
SELECT (SELECT COUNT(*) FROM game_players gp JOIN games g ON g.id = gp.game_id
    WHERE gp.player_id = p.id AND g.semester = :semester AND NOT g.is_team_game) AS games
FROM players p WHERE p.id = :player_id;
