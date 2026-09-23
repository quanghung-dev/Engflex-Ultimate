-- +goose Up
CREATE TABLE conversations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL,
    mode       text NOT NULL CONSTRAINT chk_conversations_mode
        CHECK (mode IN ('free_talk', 'roleplay')),
    scenario_id uuid REFERENCES scenarios (id) ON DELETE SET NULL,
    status     text NOT NULL CONSTRAINT chk_conversations_status
        CHECK (status IN ('live', 'ended')),
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at   timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_user_started ON conversations (user_id, started_at DESC);
CREATE INDEX idx_conversations_scenario_id ON conversations (scenario_id);

CREATE TABLE conversation_turns (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    position        int NOT NULL,
    role            text NOT NULL CONSTRAINT chk_conversation_turns_role
        CHECK (role IN ('user', 'ai')),
    text            text NOT NULL,
    feedback        jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_turns_conversation_position UNIQUE (conversation_id, position)
);

-- +goose Down
DROP TABLE IF EXISTS conversation_turns;
DROP TABLE IF EXISTS conversations;
