-- BLOCK select_players
SELECT
    CAST(id AS CHAR) AS id,
    player_name
FROM
    players;

-- BLOCK insert_game
INSERT INTO
    games (is_team_game, semester)
VALUES
    (:is_team_game, :semester);

-- BLOCK select_player_semester_data
SELECT
    *
FROM
    player_semester_data
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK update_player_semester_data
UPDATE player_semester_data
SET
    ranking = :new_ranking,
    points = :new_points
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK insert_player_game_result
INSERT INTO
    game_players (
        game_id,
        player_id,
        starting_wind,
        score,
        placement,
        point_change
    )
VALUES
    (
        :game_id,
        :player_id,
        :starting_wind,
        :score,
        :placement,
        :point_change
    );

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

-- BLOCK select_game_information
SELECT
    gp.*,
    g.*
FROM
    game_players gp
    JOIN games g ON gp.game_id = g.id
WHERE
    g.id = :game_id;

-- BLOCK remove_player_game_result
DELETE FROM game_players
WHERE
    game_id = :game_id
    AND player_id = :player_id;

-- BLOCK remove_game
DELETE FROM games
WHERE
    id = :game_id;

-- BLOCK select_team_of_player
SELECT
    team_id
FROM
    player_semester_data
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK select_team_data
SELECT
    *
FROM
    teams
WHERE
    id = :team_id;

-- BLOCK update_team_data
UPDATE teams
SET
    points = :new_points
WHERE
    id = :team_id;