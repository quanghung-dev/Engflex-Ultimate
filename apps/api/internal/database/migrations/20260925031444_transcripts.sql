-- +goose Up
-- +goose StatementBegin
CREATE TABLE transcripts (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    content TEXT NOT NULL,
    phonetic VARCHAR(500),
    vietnamese TEXT,
    start_timestamp DOUBLE PRECISION,
    end_timestamp DOUBLE PRECISION
);
CREATE INDEX idx_transcripts_lesson_id ON transcripts(lesson_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS transcripts;
-- +goose StatementEnd
