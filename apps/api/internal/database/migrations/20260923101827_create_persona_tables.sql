-- +goose Up
CREATE TABLE personas (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    role_title  text NOT NULL,
    personality text,
    style       text,
    objective   text,
    default_cefr text CONSTRAINT chk_personas_default_cefr
        CHECK (default_cefr IS NULL OR default_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scenario_topics (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       text NOT NULL UNIQUE,
    name       text NOT NULL,
    position   int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scenarios (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id   uuid NOT NULL REFERENCES scenario_topics (id) ON DELETE RESTRICT,
    persona_id uuid REFERENCES personas (id) ON DELETE SET NULL,
    title      text NOT NULL,
    objective  text NOT NULL DEFAULT '',
    cefr_level text NOT NULL CONSTRAINT chk_scenarios_cefr_level
        CHECK (cefr_level IN ('B1+', 'B2', 'C1')),
    details    jsonb NOT NULL DEFAULT '{}',
    user_id    text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_scenarios_topic_id ON scenarios (topic_id);
CREATE INDEX idx_scenarios_persona_id ON scenarios (persona_id);
CREATE INDEX idx_scenarios_user_id ON scenarios (user_id) WHERE user_id IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS scenarios;
DROP TABLE IF EXISTS scenario_topics;
DROP TABLE IF EXISTS personas;
