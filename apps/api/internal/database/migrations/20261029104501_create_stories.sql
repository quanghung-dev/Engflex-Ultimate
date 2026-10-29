-- +goose Up
CREATE TABLE stories (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             text NOT NULL UNIQUE,
    title            text NOT NULL,
    title_vietnamese text,
    cefr_level       text CONSTRAINT chk_stories_cefr_level
        CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    topic            text NOT NULL DEFAULT 'general',
    thumbnail_url    text,
    audio_url        text NOT NULL,
    duration         double precision NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stories_cefr ON stories (cefr_level);
CREATE INDEX idx_stories_slug ON stories (slug);

-- +goose Down
DROP TABLE IF EXISTS stories;
