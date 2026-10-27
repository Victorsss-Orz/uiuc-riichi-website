CREATE TABLE IF NOT EXISTS player_merges (
    source_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    target_id BIGINT UNSIGNED NOT NULL,
    KEY idx_player_merges_target (target_id),
    CONSTRAINT fk_player_merge_target FOREIGN KEY (target_id)
        REFERENCES players (id) ON DELETE RESTRICT,
    CONSTRAINT chk_player_merge_distinct CHECK (source_id <> target_id)
);
