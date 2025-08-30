-- BLOCK select_players
SELECT
    CAST(id AS CHAR) AS id,
    player_name
FROM
    players;