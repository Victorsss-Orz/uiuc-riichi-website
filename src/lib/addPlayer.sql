-- BLOCK select_player
SELECT
    *
FROM
    players
WHERE
    id = :player_id;

-- BLOCK add_player
INSERT INTO
    players (id, player_name)
VALUES
    (:player_id, :player_name);