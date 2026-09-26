-- +goose Up
CREATE TABLE conversations (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               text NOT NULL,
    mode                  text NOT NULL CONSTRAINT chk_conversations_mode
        CHECK (mode IN ('free_talk', 'roleplay')),
    scenario_id           uuid REFERENCES scenarios (id) ON DELETE SET NULL,
    status                text NOT NULL CONSTRAINT chk_conversations_status
        CHECK (status IN ('pending', 'live', 'ended', 'failed')),
    speech_session_id     text,
    speech_start_response jsonb,
    duration_sec          int,
    started_at            timestamptz NOT NULL DEFAULT now(),
    ended_at              timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_user_started ON conversations (user_id, started_at DESC);
CREATE INDEX idx_conversations_scenario_id ON conversations (scenario_id);
CREATE INDEX idx_conversations_speech_session_id ON conversations (speech_session_id);

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

-- Global per-subject coaching records. Polymorphic by design: subject_type
-- names what the row is about and subject_id points at it, with no foreign
-- key. user_id is denormalized so "all my feedback" and "delete my data"
-- stay answerable. There is deliberately no `type` column: the
-- subject-to-product mapping is a product invariant (spec D18).
CREATE TABLE feedbacks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      text NOT NULL,
    subject_type text NOT NULL,
    subject_id   text NOT NULL,
    payload      jsonb NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_feedbacks_subject UNIQUE (subject_type, subject_id)
);

-- A future speech-progress report asks "which feedback has a speech block?".
-- GIN makes that a cheap containment query rather than a sequential scan.
CREATE INDEX idx_feedbacks_payload ON feedbacks USING GIN (payload);

CREATE INDEX idx_feedbacks_user_id ON feedbacks (user_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS conversation_turns;
DROP TABLE IF EXISTS conversations;
