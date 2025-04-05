-- BLOCK select_player_semester_data
SELECT
    *
FROM
    player_semester_data
WHERE
    player_id = ?
    AND semester = ?;

-- BLOCK select_player_game_history
SELECT
    gp.*
FROM
    game_players gp
    JOIN games g ON gp.game_id = g.id
WHERE
    g.semester = ?
    AND gp.player_id = ?
    AND NOT g.is_team_game
ORDER BY
    gp.game_id;