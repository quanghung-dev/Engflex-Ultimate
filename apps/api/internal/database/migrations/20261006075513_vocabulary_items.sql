-- +goose Up
-- +goose StatementBegin
DROP TABLE IF EXISTS user_vocabulary CASCADE;
DROP TABLE IF EXISTS vocabulary_items CASCADE;

CREATE TABLE IF NOT EXISTS vocabulary_items (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES vocabulary_decks(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    transcript_id INTEGER REFERENCES transcripts(id) ON DELETE SET NULL,
    phrase VARCHAR(500) NOT NULL,
    normalized_phrase VARCHAR(500) NOT NULL,
    meaning TEXT NOT NULL,
    example_sentence TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_deck_id ON vocabulary_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_lesson_id ON vocabulary_items(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_transcript_id ON vocabulary_items(transcript_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_normalized_phrase ON vocabulary_items(normalized_phrase);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS vocabulary_items;
-- +goose StatementEnd
