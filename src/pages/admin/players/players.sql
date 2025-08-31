-- BLOCK insert_player
INSERT INTO
    players (player_name)
VALUES
    (:player_name);

-- BLOCK select_players
SELECT
    *
FROM
    players;

-- BLOCK remove_player
DELETE FROM players
WHERE
    id = (:player_id);