-- BLOCK select_player_games
SELECT
    gp.*,
    rg.game_time,
    rg.is_team_game,
    p.player_name
FROM
    (
        SELECT
            g.id,
            g.game_time,
            g.is_team_game
        FROM
            games g
            JOIN game_players gp ON g.id = gp.game_id
        WHERE
            gp.player_id = ?
            AND g.semester = ?
    ) rg
    JOIN game_players gp ON rg.id = gp.game_id
    JOIN players p ON gp.player_id = p.id
ORDER BY
    rg.game_time DESC,
    gp.placement ASC;

-- BLOCK select_all_games
SELECT
    gp.*,
    g.game_time,
    g.is_team_game,
    p.player_name
FROM
    games g
    JOIN game_players gp ON g.id = gp.game_id
    JOIN players p ON gp.player_id = p.id
ORDER BY
    g.game_time DESC,
    gp.placement ASC;