-- +goose Up
CREATE TABLE lesson_categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       text NOT NULL UNIQUE,
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lessons (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL,
    category_id uuid NOT NULL REFERENCES lesson_categories (id) ON DELETE RESTRICT,
    cefr_level  text NOT NULL CONSTRAINT chk_lessons_cefr_level
        CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    description text NOT NULL DEFAULT '',
    details     jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lessons_category_id ON lessons (category_id);
CREATE INDEX idx_lessons_cefr_level ON lessons (cefr_level);

CREATE TABLE lesson_activities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    part_number int NOT NULL,
    type        text NOT NULL CONSTRAINT chk_lesson_activities_type
        CHECK (type IN ('reading', 'dictation', 'writing', 'voice')),
    title       text NOT NULL,
    description text NOT NULL DEFAULT '',
    config      jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_lesson_activities_lesson_part UNIQUE (lesson_id, part_number)
);

CREATE TABLE lesson_bookmarks (
    user_id    text NOT NULL,
    lesson_id  uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX idx_lesson_bookmarks_lesson_id ON lesson_bookmarks (lesson_id);

-- +goose Down
DROP TABLE IF EXISTS lesson_bookmarks;
DROP TABLE IF EXISTS lesson_activities;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS lesson_categories;
