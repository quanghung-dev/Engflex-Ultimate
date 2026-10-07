-- +goose Up
CREATE TABLE lesson_sections (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL,
    description text NOT NULL DEFAULT '',
    cefr_band   text NOT NULL CONSTRAINT chk_lesson_sections_cefr_band
        CHECK (cefr_band IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    position    int NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS lesson_sections;
DROP TABLE IF EXISTS lesson_categories;
