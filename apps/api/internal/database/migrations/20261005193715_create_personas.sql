-- +goose Up
CREATE TABLE personas (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    role_title  text NOT NULL,
    personality text,
    style       text,
    objective   text,
    gender      text NOT NULL DEFAULT 'female' CONSTRAINT chk_personas_gender
        CHECK (gender IN ('male', 'female')),
    default_cefr text CONSTRAINT chk_personas_default_cefr
        CHECK (default_cefr IS NULL OR default_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS personas;
