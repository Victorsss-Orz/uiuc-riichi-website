-- BLOCK insert_player
INSERT INTO
    players (player_name)
VALUES
    (?);

-- BLOCK select_players
SELECT
    CAST(id AS CHAR) AS id,
    player_name
FROM
    players;

-- BLOCK remove_player
DELETE FROM players
WHERE
    id = (?);