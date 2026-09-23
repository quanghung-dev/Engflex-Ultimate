-- +goose Up
CREATE TABLE vocabulary_items (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    term               text NOT NULL,
    definition         text NOT NULL DEFAULT '',
    cefr               text NOT NULL CONSTRAINT chk_vocabulary_items_cefr
        CHECK (cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    domain             text CONSTRAINT chk_vocabulary_items_domain
        CHECK (domain IS NULL OR domain IN
            ('backend_db', 'distributed_systems', 'devops_cloud', 'frontend_ui', 'ai_ml')),
    created_by_user_id text,
    details            jsonb NOT NULL DEFAULT '{}',
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_vocabulary_items_global_term
    ON vocabulary_items (lower(term)) WHERE created_by_user_id IS NULL;
CREATE UNIQUE INDEX uq_vocabulary_items_user_term
    ON vocabulary_items (created_by_user_id, lower(term)) WHERE created_by_user_id IS NOT NULL;
CREATE INDEX idx_vocabulary_items_cefr ON vocabulary_items (cefr);
CREATE INDEX idx_vocabulary_items_domain ON vocabulary_items (domain);

CREATE TABLE user_vocabulary (
    user_id     text NOT NULL,
    item_id     uuid NOT NULL REFERENCES vocabulary_items (id) ON DELETE CASCADE,
    source_type text NOT NULL CONSTRAINT chk_user_vocabulary_source_type
        CHECK (source_type IN ('lesson', 'conversation', 'manual')),
    source_id   uuid,
    note        text,
    mastered    boolean NOT NULL DEFAULT false,
    srs_due_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);
CREATE INDEX idx_user_vocabulary_due ON user_vocabulary (user_id, srs_due_at);

-- +goose Down
DROP TABLE IF EXISTS user_vocabulary;
DROP TABLE IF EXISTS vocabulary_items;
