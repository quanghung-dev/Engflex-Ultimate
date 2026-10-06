-- +goose Up
CREATE TABLE video_exercises (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   uuid REFERENCES video_categories (id) ON DELETE SET NULL,
    title         text NOT NULL,
    description   text NOT NULL DEFAULT '',
    video_url     text NOT NULL,
    thumbnail_url text,
    cefr_level    text CONSTRAINT chk_video_exercises_cefr_level
        CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    duration      double precision,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_video_exercises_category_id ON video_exercises (category_id);

-- +goose Down
DROP TABLE IF EXISTS video_exercises;
