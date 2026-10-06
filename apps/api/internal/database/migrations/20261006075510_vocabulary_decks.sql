-- +goose Up
CREATE TABLE vocabulary_decks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       text NOT NULL,
    category_id   uuid REFERENCES vocabulary_categories (id) ON DELETE SET NULL,
    name          text NOT NULL,
    description   text,
    thumbnail_url text,
    level         text,
    is_default    boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vocabulary_decks_user_id ON vocabulary_decks (user_id);
CREATE INDEX idx_vocabulary_decks_category_id ON vocabulary_decks (category_id);

-- +goose Down
DROP TABLE IF EXISTS vocabulary_decks;
