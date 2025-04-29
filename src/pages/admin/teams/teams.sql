-- BLOCK select_teams
SELECT
    *
FROM
    teams
WHERE
    semester = (?);

-- BLOCK insert_team
INSERT INTO
    teams (team_name, semester)
VALUES
    (?, ?);

-- BLOCK select_players_of_team
SELECT
    p.*
FROM
    player_semester_data psd
    JOIN players p ON psd.player_id = p.id
WHERE
    psd.team_id = (?);

-- BLOCK select_unassigned_players
SELECT
    p.*
FROM
    player_semester_data psd
    JOIN players p ON psd.player_id = p.id
WHERE
    psd.team_id IS NULL;

-- BLOCK update_player_team
UPDATE player_semester_data
SET
    team_id = (?)
WHERE
    player_id = (?)
    AND semester = (?);

-- BLOCK remove_player_from_team
UPDATE player_semester_data
SET
    team_id = NULL
WHERE
    player_id = (?)
    AND semester = (?);