-- BLOCK select_teams
SELECT
    *
FROM
    teams
WHERE
    semester = :semester;

-- BLOCK insert_team
INSERT INTO
    teams (team_name, semester)
VALUES
    (:team_name, :semester);

-- BLOCK select_players_of_team
SELECT
    CAST(p.id AS CHAR) AS id,
    p.player_name
FROM
    player_semester_data psd
    JOIN players p ON psd.player_id = p.id
WHERE
    psd.team_id = :team_id;

-- BLOCK select_unassigned_players
SELECT
    CAST(p.id AS CHAR) AS id,
    p.player_name
FROM
    player_semester_data psd
    JOIN players p ON psd.player_id = p.id
WHERE
    psd.semester = :semester
    AND psd.team_id IS NULL;

-- BLOCK update_player_team
UPDATE player_semester_data
SET
    team_id = :team_id
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK remove_player_from_team
UPDATE player_semester_data
SET
    team_id = NULL
WHERE
    player_id = :player_id
    AND semester = :semester;

-- BLOCK remove_team
DELETE FROM teams
WHERE
    id = :team_id;