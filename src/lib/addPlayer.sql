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
SELECT :player_id, :player_name
WHERE NOT EXISTS (SELECT 1 FROM player_merges WHERE source_id = :player_id);

-- BLOCK update_player_name
UPDATE players
SET
    player_name = :player_name
WHERE
    id = :player_id;
