-- +goose Up
CREATE TABLE video_transcripts (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    video_exercise_id uuid NOT NULL REFERENCES video_exercises (id) ON DELETE CASCADE,
    sequence          int NOT NULL,
    content           text NOT NULL,
    phonetic          text,
    vietnamese        text,
    start_timestamp   double precision,
    end_timestamp     double precision,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_video_transcripts_video_exercise_id ON video_transcripts (video_exercise_id);

-- +goose Down
DROP TABLE IF EXISTS video_transcripts;
