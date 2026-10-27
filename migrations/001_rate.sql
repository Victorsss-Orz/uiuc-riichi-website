ALTER TABLE players ADD COLUMN rate DOUBLE NOT NULL DEFAULT 1500;
ALTER TABLE players ADD COLUMN rate_games INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN rate_rookie_handicap DOUBLE NULL;
ALTER TABLE game_players ADD COLUMN rate_change DOUBLE NULL;
CREATE INDEX idx_game_players_player ON game_players (player_id);
CREATE INDEX idx_game_players_game ON game_players (game_id);
