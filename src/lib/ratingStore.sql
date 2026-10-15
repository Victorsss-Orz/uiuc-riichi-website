-- BLOCK reference_rates
SELECT rate FROM players WHERE rate_games >= :minimum_games;

-- BLOCK game_ratings
SELECT id, rate, rate_games, rate_rookie_handicap FROM players
WHERE id IN (:player_1, :player_2, :player_3, :player_4);

-- BLOCK save_rating
UPDATE players SET rate = :rate, rate_games = :games, rate_rookie_handicap = :handicap
WHERE id = :player_id;

-- BLOCK save_change
UPDATE game_players SET rate_change = :change
WHERE game_id = :game_id AND player_id = :player_id AND rate_change IS NULL;

-- BLOCK undo_rating
UPDATE players SET
  rate = IF(rate_games = 1, 1500, rate - :change),
  rate_rookie_handicap = IF(rate_games = 1, NULL, rate_rookie_handicap),
  rate_games = rate_games - 1
WHERE id = :player_id AND rate_games > 0;
