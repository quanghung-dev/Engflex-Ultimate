-- +goose Up
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

-- +goose Down
DROP TABLE IF EXISTS lesson_activities;
