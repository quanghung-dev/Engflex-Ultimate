-- +goose Up
CREATE TABLE user_profiles (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               text NOT NULL UNIQUE,
    preferences           jsonb NOT NULL DEFAULT '{}',
    onboarding_completed_at timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS user_profiles;
