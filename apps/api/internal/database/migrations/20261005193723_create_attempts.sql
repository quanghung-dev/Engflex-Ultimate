-- +goose Up
CREATE TABLE attempts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         text NOT NULL,
    lesson_id       uuid REFERENCES lessons (id) ON DELETE SET NULL,
    type            text NOT NULL CONSTRAINT chk_attempts_type
        CHECK (type IN ('reading', 'listening', 'writing', 'speaking',
                        'shadowing', 'flashcard', 'benchmark', 'dictation', 'lesson')),
    status          text NOT NULL DEFAULT 'in_progress' CONSTRAINT chk_attempts_status
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    score           numeric(5, 2),
    result          jsonb NOT NULL DEFAULT '{}',
    duration_sec    integer,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user_created ON attempts (user_id, created_at DESC);
CREATE INDEX idx_attempts_user_type ON attempts (user_id, type);
CREATE INDEX idx_attempts_lesson_id ON attempts (lesson_id);

-- +goose Down
DROP TABLE IF EXISTS attempts;
