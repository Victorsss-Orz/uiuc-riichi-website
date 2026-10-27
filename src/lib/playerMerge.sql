-- BLOCK players
SELECT id, player_name, rate, rate_games, rate_rookie_handicap FROM players
WHERE id IN (:source_id, :target_id) ORDER BY id FOR UPDATE;

-- BLOCK mappings
SELECT * FROM player_merges
WHERE source_id IN (:source_id, :target_id) OR target_id IN (:source_id, :target_id)
ORDER BY source_id FOR UPDATE;

-- BLOCK redirects
SELECT * FROM player_merges WHERE source_id IN (:player_ids);

-- BLOCK history
SELECT CAST(gp.game_id AS CHAR) AS game_id, gp.player_id, gp.score, gp.placement,
    gp.starting_wind, gp.point_change, gp.rate_change,
    g.semester, g.is_team_game, UNIX_TIMESTAMP(g.game_time) AS game_time
FROM game_players gp LEFT JOIN games g ON g.id = gp.game_id
WHERE gp.player_id IN (:source_id, :target_id)
ORDER BY gp.game_id, gp.player_id;

-- BLOCK semesters
SELECT d.player_id, d.semester, d.ranking, d.points, CAST(d.team_id AS CHAR) AS team_id,
    t.semester AS team_semester
FROM player_semester_data d LEFT JOIN teams t ON t.id = d.team_id
WHERE d.player_id IN (:source_id, :target_id)
ORDER BY d.semester, d.player_id FOR UPDATE;

-- BLOCK game_checks
SELECT CAST(gp.game_id AS CHAR) AS game_id, COUNT(*) AS entries,
    COUNT(DISTINCT gp.player_id) AS players, COUNT(p.id) AS registered,
    SUM(gp.placement BETWEEN 1 AND 4) AS valid_placements, SUM(gp.score) AS score,
    COUNT(gp.rate_change) AS settled
FROM (SELECT DISTINCT game_id FROM game_players
      WHERE player_id IN (:source_id, :target_id)) affected
JOIN game_players gp ON gp.game_id = affected.game_id
LEFT JOIN players p ON p.id = gp.player_id
GROUP BY gp.game_id ORDER BY gp.game_id;

-- BLOCK move_results
UPDATE game_players SET player_id = :target_id WHERE player_id = :source_id;

-- BLOCK remove_target_redirect
DELETE FROM player_merges WHERE source_id = :target_id;

-- BLOCK create_target
INSERT INTO players (id, player_name) VALUES (:target_id, :player_name);

-- BLOCK update_semester
UPDATE player_semester_data SET points = :points, ranking = :ranking, team_id = :team_id
WHERE player_id = :target_id AND semester = :semester;

-- BLOCK insert_semester
INSERT INTO player_semester_data (player_id, semester, points, ranking, team_id)
VALUES (:target_id, :semester, :points, :ranking, :team_id);

-- BLOCK remove_source_semesters
DELETE FROM player_semester_data WHERE player_id = :source_id;

-- BLOCK update_rating
UPDATE players SET rate = :rate, rate_games = :games, rate_rookie_handicap = :handicap
WHERE id = :target_id;

-- BLOCK remove_source
DELETE FROM players WHERE id = :source_id;

-- BLOCK redirect_incoming
UPDATE player_merges SET target_id = :target_id WHERE target_id = :source_id;

-- BLOCK remember_merge
INSERT INTO player_merges (source_id, target_id) VALUES (:source_id, :target_id);

-- BLOCK search
SELECT id, player_name, rate, rate_games FROM players
WHERE player_name LIKE :pattern ESCAPE '!' OR id = :exact_id
ORDER BY (id = :exact_id) DESC, (player_name = :term) DESC, player_name, id LIMIT 21;
