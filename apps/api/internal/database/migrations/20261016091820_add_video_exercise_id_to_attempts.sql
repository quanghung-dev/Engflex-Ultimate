-- +goose Up
ALTER TABLE attempts
    ADD COLUMN video_exercise_id uuid REFERENCES video_exercises (id) ON DELETE CASCADE;

CREATE INDEX idx_attempts_video_exercise_id ON attempts (video_exercise_id);
CREATE INDEX idx_attempts_user_video_type_status ON attempts (user_id, video_exercise_id, type, status);

-- +goose Down
DROP INDEX IF EXISTS idx_attempts_user_video_type_status;
DROP INDEX IF EXISTS idx_attempts_video_exercise_id;
ALTER TABLE attempts DROP COLUMN IF EXISTS video_exercise_id;