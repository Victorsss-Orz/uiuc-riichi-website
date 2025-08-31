-- BLOCK select_player_semester_data
SELECT
    *
FROM
    player_semester_data
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK select_player_game_history
SELECT
    gp.*
FROM
    game_players gp
    JOIN games g ON gp.game_id = g.id
WHERE
    g.semester = :semester
    AND gp.player_id = :player_id
    AND NOT g.is_team_game
ORDER BY
    gp.game_id;

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