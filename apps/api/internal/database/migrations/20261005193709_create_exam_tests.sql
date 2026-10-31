-- +goose Up
CREATE TABLE exam_tests (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES exam_categories (id) ON DELETE RESTRICT,
    source_key  text NOT NULL CONSTRAINT uq_exam_tests_source_key UNIQUE,
    slug        text NOT NULL CONSTRAINT uq_exam_tests_slug UNIQUE,
    title       text NOT NULL,
    content     jsonb NOT NULL CONSTRAINT chk_exam_tests_content_object
        CHECK (jsonb_typeof(content) = 'object'),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_tests_category_id ON exam_tests (category_id);

-- +goose Down
DROP TABLE IF EXISTS exam_tests;
