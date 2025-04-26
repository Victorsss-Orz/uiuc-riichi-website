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