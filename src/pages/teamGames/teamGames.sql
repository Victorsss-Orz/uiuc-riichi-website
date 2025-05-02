-- BLOCK select_teams
SELECT
    *
FROM
    teams
WHERE
    teams.semester = :semester;

-- BLOCK select_team_players
SELECT
    player_id
FROM
    player_semester_data
WHERE
    team_id = :team_id;