-- BLOCK select_team_game_history
SELECT
    gp.*
FROM
    game_players gp
    JOIN player_semester_data smd ON smd.player_id = gp.player_id
    JOIN games g ON gp.game_id = g.id
WHERE
    smd.team_id = :team_id
    AND g.is_team_game
ORDER BY
    gp.game_id;