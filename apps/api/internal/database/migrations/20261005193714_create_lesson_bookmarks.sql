-- +goose Up
CREATE TABLE lesson_bookmarks (
    user_id    text NOT NULL,
    lesson_id  uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX idx_lesson_bookmarks_lesson_id ON lesson_bookmarks (lesson_id);

-- +goose Down
DROP TABLE IF EXISTS lesson_bookmarks;
