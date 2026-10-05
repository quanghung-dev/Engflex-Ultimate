-- +goose Up
CREATE TABLE conversation_turns (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    position        int NOT NULL,
    role            text NOT NULL CONSTRAINT chk_conversation_turns_role
        CHECK (role IN ('user', 'ai')),
    text            text NOT NULL,
    was_interrupted boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_turns_conversation_position UNIQUE (conversation_id, position)
);

-- +goose Down
DROP TABLE IF EXISTS conversation_turns;
