CREATE DATABASE IF NOT EXISTS uiucriichi_data;

USE uiucriichi_data;

DROP TABLE IF EXISTS player_semester_data,
game_players,
semesters,
teams,
games,
players;

CREATE TABLE IF NOT EXISTS players (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (semester TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_name TEXT NOT NULL,
    points FLOAT NOT NULL DEFAULT 0,
    semester TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    game_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_team_game BOOLEAN NOT NULL DEFAULT false,
    semester TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_semester_data (
    player_id BIGINT UNSIGNED NOT NULL REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
    semester TEXT NOT NULL,
    ranking INT NOT NULL DEFAULT 0,
    points FLOAT NOT NULL DEFAULT 0,
    team_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS game_players (
    game_id BIGINT UNSIGNED NOT NULL REFERENCES games (id) ON DELETE CASCADE ON UPDATE CASCADE,
    player_id BIGINT UNSIGNED NOT NULL REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
    starting_wind ENUM('East', 'South', 'West', 'North'),
    score BIGINT NOT NULL,
    placement INT NOT NULL,
    point_change FLOAT NOT NULL,
    CONSTRAINT chk_placement CHECK (placement IN (1, 2, 3, 4))
);

DELIMITER $$
CREATE TRIGGER after_insert_semester
AFTER INSERT ON semesters
FOR EACH ROW
BEGIN
    INSERT INTO player_semester_data (player_id, semester)
    SELECT id, NEW.semester
    FROM players;
END$$

CREATE TRIGGER after_insert_player
AFTER INSERT ON players
FOR EACH ROW
BEGIN
    INSERT INTO player_semester_data (player_id, semester)
    SELECT NEW.id, semester
    FROM semesters;
END$$
DELIMITER ;

INSERT INTO
    semesters (semester)
VALUES
    ('sp25');

INSERT INTO
    semesters (semester)
VALUES
    ('fa25');

INSERT INTO
    players (player_name)
VALUES
    ('H');

INSERT INTO
    players (player_name)
VALUES
    ('浩');

INSERT INTO
    players (player_name)
VALUES
    ('秦始皇');

INSERT INTO
    players (player_name)
VALUES
    ('zcy');