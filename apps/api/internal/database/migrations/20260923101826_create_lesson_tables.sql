-- +goose Up
CREATE TABLE lesson_practice_categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       text NOT NULL UNIQUE,
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lessons_practice (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL,
    category_id uuid NOT NULL REFERENCES lesson_practice_categories (id) ON DELETE RESTRICT,
    cefr_level  text NOT NULL CONSTRAINT chk_lessons_practice_cefr_level
        CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    description text NOT NULL DEFAULT '',
    details     jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lessons_practice_category_id ON lessons_practice (category_id);
CREATE INDEX idx_lessons_practice_cefr_level ON lessons_practice (cefr_level);

CREATE TABLE lesson_practice_activities (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_practice_id uuid NOT NULL REFERENCES lessons_practice (id) ON DELETE CASCADE,
    part_number        int NOT NULL,
    type               text NOT NULL CONSTRAINT chk_lesson_practice_activities_type
        CHECK (type IN ('reading', 'dictation', 'writing', 'voice')),
    title              text NOT NULL,
    description        text NOT NULL DEFAULT '',
    config             jsonb NOT NULL DEFAULT '{}',
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_lesson_practice_activities_part UNIQUE (lesson_practice_id, part_number)
);

CREATE TABLE lesson_practice_bookmarks (
    user_id            text NOT NULL,
    lesson_practice_id uuid NOT NULL REFERENCES lessons_practice (id) ON DELETE CASCADE,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_practice_id)
);
CREATE INDEX idx_lesson_practice_bookmarks_lesson_practice_id ON lesson_practice_bookmarks (lesson_practice_id);

-- +goose Down
DROP TABLE IF EXISTS lesson_practice_bookmarks;
DROP TABLE IF EXISTS lesson_practice_activities;
DROP TABLE IF EXISTS lessons_practice;
DROP TABLE IF EXISTS lesson_practice_categories;

