-- BLOCK insert_player
INSERT INTO
    players (player_name)
VALUES
    (?);

-- BLOCK select_players
SELECT
    *
FROM
    players;