-- +goose Up
CREATE TABLE attempts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         text NOT NULL,
    lesson_id       uuid REFERENCES lessons (id) ON DELETE SET NULL,
    activity_id     uuid REFERENCES lesson_activities (id) ON DELETE SET NULL,
    conversation_id uuid REFERENCES conversations (id) ON DELETE SET NULL,
    type            text NOT NULL CONSTRAINT chk_attempts_type
        CHECK (type IN ('reading', 'dictation', 'writing', 'voice',
                        'shadowing', 'flashcard', 'benchmark')),
    score           numeric(5, 2),
    result          jsonb NOT NULL DEFAULT '{}',
    duration_sec    integer,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user_created ON attempts (user_id, created_at DESC);
CREATE INDEX idx_attempts_user_type ON attempts (user_id, type);
CREATE INDEX idx_attempts_lesson_id ON attempts (lesson_id);
CREATE INDEX idx_attempts_activity_id ON attempts (activity_id);
CREATE INDEX idx_attempts_conversation_id ON attempts (conversation_id);

-- +goose Down
DROP TABLE IF EXISTS attempts;
