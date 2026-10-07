-- +goose Up
CREATE TABLE lessons (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL,
    section_id  uuid NOT NULL REFERENCES lesson_sections (id) ON DELETE RESTRICT,
    cefr_level  text NOT NULL CONSTRAINT chk_lessons_cefr_level
        CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    description text NOT NULL DEFAULT '',
    details     jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lessons_section_created ON lessons (section_id, created_at);

-- +goose Down
DROP TABLE IF EXISTS lessons;
