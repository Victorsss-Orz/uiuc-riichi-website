CREATE DATABASE riichi;

USE riichi;

CREATE TABLE
    IF NOT EXISTS players (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        player_name TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS player_semester_data (
        player_id BIGINT NOT NULL REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
        semester TEXT NOT NULL,
        grade INT NOT NULL DEFAULT 0,
        rating INT NOT NULL DEFAULT 0,
        team_id BIGINT REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS semesters (semester TEXT NOT NULL);

CREATE TABLE
    IF NOT EXISTS teams (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_name TEXT NOT NULL,
        points FLOAT NOT NULL DEFAULT 0
    );

CREATE TABLE
    IF NOT EXISTS games (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        game_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_team_game BOOLEAN NOT NULL DEFAULT false,
        semester TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS game_players (
        game_id BIGINT NOT NULL REFERENCES games (id) ON DELETE CASCADE ON UPDATE CASCADE,
        player_id BIGINT NOT NULL REFERENCES players (id) ON DELETE CASCADE ON UPDATE CASCADE,
        starting_wind ENUM ('East', 'South', 'West', 'North'),
        score BIGINT NOT NULL,
        placement INT NOT NULL,
        point_change FLOAT NOT NULL,
        CONSTRAINT chk_placement CHECK (placement IN (1, 2, 3, 4))
    );