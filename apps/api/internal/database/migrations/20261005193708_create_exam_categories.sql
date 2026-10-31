-- +goose Up
CREATE TABLE exam_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL CONSTRAINT uq_exam_categories_slug UNIQUE,
    title       text NOT NULL,
    type        text NOT NULL CONSTRAINT chk_exam_categories_type
        CHECK (type = 'toeic'),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS exam_categories;
