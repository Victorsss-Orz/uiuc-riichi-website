-- BLOCK select_teams
SELECT
    *
FROM
    teams
WHERE
    semester = (?);

-- BLOCK insert_team
INSERT INTO teams(team_name, semester) VALUES (?, ?);