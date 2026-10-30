    -- +goose Up
CREATE TABLE story_sentences (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id        uuid NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
    sequence        int NOT NULL,
    english_text    text NOT NULL,
    vietnamese_text text NOT NULL DEFAULT '',
    image_url       text,
    start_timestamp double precision NOT NULL DEFAULT 0,
    end_timestamp   double precision NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_story_sentences_story_id ON story_sentences (story_id, sequence ASC);

-- +goose Down
DROP TABLE IF EXISTS story_sentences;
