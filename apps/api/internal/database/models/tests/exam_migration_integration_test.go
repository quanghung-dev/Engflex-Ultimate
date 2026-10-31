package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
)

// Run against a dedicated database after applying the real Goose chain.
// Every fixture is rolled back; this suite never migrates or resets a database.
func examMigrationDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to a migrated PostgreSQL test database")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormlogger.Discard})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, sqlDB.Close()) })
	return db
}

func examMigrationFixture(t *testing.T, db *gorm.DB) (*gorm.DB, *models.ExamTest, *models.Attempt) {
	t.Helper()
	tx := db.Begin()
	require.NoError(t, tx.Error)
	t.Cleanup(func() { require.NoError(t, tx.Rollback().Error) })
	category := &models.ExamCategory{
		Slug: uuid.NewString(), Title: "ETS fixture", Type: enums.ExamTypeTOEIC,
	}
	require.NoError(t, tx.Create(category).Error)
	exam := &models.ExamTest{
		CategoryID: category.ID,
		SourceKey:  uuid.NewString(), Slug: uuid.NewString(), Title: "Migration fixture",
		Content: datatypes.JSON(`{"parts":[]}`),
	}
	require.NoError(t, tx.Create(exam).Error)
	mode := enums.ExamModePractice
	now := time.Now().UTC().Truncate(time.Microsecond)
	attempt := &models.Attempt{
		UserID: uuid.NewString(), Type: enums.AttemptTypeExam,
		Status: enums.AttemptStatusInProgress, ExamTestID: &exam.ID,
		Mode: &mode, SelectedParts: pq.Int64Array{1, 3}, StartedAt: &now,
		Result: datatypes.JSON(`{"answers":{},"revision":1}`),
	}
	require.NoError(t, tx.Create(attempt).Error)
	return tx, exam, attempt
}

func TestExamMigrationConstraints(t *testing.T) {
	db := examMigrationDB(t)
	cases := []struct {
		name, table, assignment, state string
	}{
		{"category type", "exam_categories", "type = 'unknown'", "23514"},
		{"category type required", "exam_categories", "type = NULL", "23502"},
		{"category required", "exam_tests", "category_id = NULL", "23502"},
		{"unknown category", "exam_tests", "category_id = '00000000-0000-0000-0000-000000000001'", "23503"},
		{"content array", "exam_tests", "content = '[]'::jsonb", "23514"},
		{"content scalar", "exam_tests", "content = '1'::jsonb", "23514"},
		{"content JSON null", "exam_tests", "content = 'null'::jsonb", "23514"},
		{"content SQL null", "exam_tests", "content = NULL", "23502"},
		{"missing exam", "attempts", "exam_test_id = NULL", "23514"},
		{"unknown exam", "attempts", "exam_test_id = '00000000-0000-0000-0000-000000000001'", "23503"},
		{"missing mode", "attempts", "mode = NULL", "23514"},
		{"unknown mode", "attempts", "mode = 'unknown'", "23514"},
		{"missing started", "attempts", "started_at = NULL", "23514"},
		{"lesson target", "attempts", "lesson_id = (SELECT id FROM lessons LIMIT 1)", "23514"},
		{"video target", "attempts", "video_exercise_id = (SELECT id FROM video_exercises LIMIT 1)", "23514"},
		{"non exam with exam fields", "attempts", "type = 'lesson'", "23514"},
		{"non exam with exam id only", "attempts", "type = 'reading', mode = NULL, selected_parts = NULL", "23514"},
		{"non exam with mode only", "attempts", "type = 'reading', exam_test_id = NULL, selected_parts = NULL", "23514"},
		{"non exam with parts only", "attempts", "type = 'reading', exam_test_id = NULL, mode = NULL", "23514"},
		{"unknown attempt type", "attempts", "type = 'unknown'", "23514"},
		{"unknown status", "attempts", "status = 'unknown'", "23514"},
		{"parts SQL null", "attempts", "selected_parts = NULL", "23514"},
		{"parts empty", "attempts", "selected_parts = '{}'::smallint[]", "23514"},
		{"parts below range", "attempts", "selected_parts = '{0}'::smallint[]", "23514"},
		{"parts above range", "attempts", "selected_parts = '{8}'::smallint[]", "23514"},
		{"parts null element", "attempts", "selected_parts = '{1,NULL}'::smallint[]", "23514"},
		// array_position may reject multidimensional input before the CHECK does.
		{"parts multidimensional", "attempts", "selected_parts = '{{1,2},{3,4}}'::smallint[]", ""},
		{"parts lower bound", "attempts", "selected_parts = '[0:1]={1,3}'::smallint[]", "23514"},
		{"practice too many parts", "attempts", "selected_parts = '{1,1,1,1,1,1,1,1}'::smallint[]", "23514"},
		{"exam missing parts", "attempts", "mode = 'exam'", "23514"},
		{"exam duplicate replaces part", "attempts", "mode = 'exam', selected_parts = '{1,2,3,4,5,6,6}'::smallint[]", "23514"},
		{"completed without submitted", "attempts", "status = 'completed'", "23514"},
		{"submitted before start", "attempts", "submitted_at = started_at - interval '1 second'", "23514"},
		{"deadline before start", "attempts", "deadline_at = started_at - interval '1 second'", "23514"},
		{"negative duration", "attempts", "duration_sec = -1", "23514"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			tx, exam, attempt := examMigrationFixture(t, db)
			id := attempt.ID
			if tc.table == "exam_tests" {
				id = exam.ID
			}
			if tc.table == "exam_categories" {
				id = exam.CategoryID
			}
			err := tx.Exec(fmt.Sprintf("UPDATE %s SET %s WHERE id = ?", tc.table, tc.assignment), id).Error
			require.Error(t, err)
			var pgErr *pgconn.PgError
			require.ErrorAs(t, err, &pgErr)
			if tc.state != "" {
				require.Equal(t, tc.state, pgErr.Code)
			}
		})
	}
	for _, column := range []string{"source_key", "slug"} {
		t.Run("unique "+column, func(t *testing.T) {
			tx, exam, _ := examMigrationFixture(t, db)
			duplicate := *exam
			duplicate.ID = ""
			if column == "source_key" {
				duplicate.Slug = uuid.NewString()
			} else {
				duplicate.SourceKey = uuid.NewString()
			}
			err := tx.Create(&duplicate).Error
			var pgErr *pgconn.PgError
			require.ErrorAs(t, err, &pgErr)
			require.Equal(t, "23505", pgErr.Code)
		})
	}
	t.Run("restrict exam deletion", func(t *testing.T) {
		tx, exam, _ := examMigrationFixture(t, db)
		err := tx.Delete(exam).Error
		var pgErr *pgconn.PgError
		require.ErrorAs(t, err, &pgErr)
		// PostgreSQL 18 reports RESTRICT as 23001; older versions use 23503.
		require.Contains(t, []string{"23001", "23503"}, pgErr.Code)
		require.Equal(t, "attempts_exam_test_id_fkey", pgErr.ConstraintName)
	})
}

func TestExamMigrationRoundTrip(t *testing.T) {
	db := examMigrationDB(t)
	tx, exam, attempt := examMigrationFixture(t, db)
	repo := repositories.NewAttemptRepository(tx)
	ctx := context.Background()

	var loaded models.Attempt
	require.NoError(t, tx.Joins("ExamTest.Category").First(&loaded, "attempts.id = ?", attempt.ID).Error)
	require.NotNil(t, loaded.ExamTest)
	require.Equal(t, exam.ID, loaded.ExamTest.ID)
	require.NotNil(t, loaded.ExamTest.Category)
	require.Equal(t, exam.CategoryID, loaded.ExamTest.Category.ID)
	require.Equal(t, enums.ExamTypeTOEIC, loaded.ExamTest.Category.Type)
	require.Equal(t, enums.ExamModePractice, *loaded.Mode)
	require.Equal(t, attempt.SelectedParts, loaded.SelectedParts)
	require.True(t, attempt.StartedAt.Equal(*loaded.StartedAt))
	require.Nil(t, loaded.Score)
	require.JSONEq(t, string(attempt.Result), string(loaded.Result))
	require.JSONEq(t, string(exam.Content), string(loaded.ExamTest.Content))

	// FullSaveAssociations must still respect the relation's read-only tag.
	loaded.ExamTest.Title = "must not persist"
	loaded.ExamTest.Content = datatypes.JSON(`{"mustNotPersist":true}`)
	loaded.SelectedParts = pq.Int64Array{1, 2, 3, 4, 5, 6, 7}
	fullMode := enums.ExamModeExam
	loaded.Mode = &fullMode
	submitted := loaded.StartedAt.Add(2 * time.Hour)
	deadline := loaded.StartedAt.Add(time.Hour)
	loaded.Status = enums.AttemptStatusCompleted
	loaded.SubmittedAt, loaded.DeadlineAt = &submitted, &deadline
	require.NoError(t, tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(&loaded).Error)
	var storedExam models.ExamTest
	require.NoError(t, tx.First(&storedExam, "id = ?", exam.ID).Error)
	require.Equal(t, exam.Title, storedExam.Title)
	require.JSONEq(t, string(exam.Content), string(storedExam.Content))
	var examCount int64
	require.NoError(t, tx.Model(&models.ExamTest{}).Where("id = ?", exam.ID).Count(&examCount).Error)
	require.EqualValues(t, 1, examCount)

	// A second attempt by the same user on the same exam remains valid.
	attempt.ID = ""
	require.NoError(t, repo.Create(ctx, attempt))
	var retakes int64
	require.NoError(t, tx.Model(&models.Attempt{}).Where("user_id = ? AND exam_test_id = ?", attempt.UserID, exam.ID).Count(&retakes).Error)
	require.EqualValues(t, 2, retakes)
	got, err := repo.GetByID(ctx, loaded.ID)
	require.NoError(t, err)
	require.Equal(t, fullMode, *got.Mode)
	require.Equal(t, loaded.SelectedParts, got.SelectedParts)
	require.True(t, submitted.Equal(*got.SubmittedAt))
	require.True(t, deadline.Equal(*got.DeadlineAt))
	require.Nil(t, got.Score)
	var result map[string]json.RawMessage
	require.NoError(t, json.Unmarshal(got.Result, &result))
	require.NotContains(t, result, "totalScore")

	var lesson models.Lesson
	var video models.VideoExercise
	require.NoError(t, tx.First(&lesson).Error)
	require.NoError(t, tx.First(&video).Error)
	for _, fixture := range []*models.Attempt{
		{UserID: attempt.UserID, Type: enums.AttemptTypeLesson, LessonID: &lesson.ID, Status: enums.AttemptStatusCompleted},
		{UserID: attempt.UserID, Type: enums.AttemptTypeDictation, VideoExerciseID: &video.ID, Status: enums.AttemptStatusCompleted},
		{UserID: attempt.UserID, Type: enums.AttemptTypeReading, Status: enums.AttemptStatusCompleted},
		{UserID: attempt.UserID, Type: enums.AttemptTypeLesson, Status: enums.AttemptStatusInProgress},
		{UserID: attempt.UserID, Type: enums.AttemptTypeLesson, Status: enums.AttemptStatusAbandoned},
		{UserID: "other-user", Type: enums.AttemptTypeLesson, Status: enums.AttemptStatusCompleted},
	} {
		require.NoError(t, repo.Create(ctx, fixture))
		roundTrip, err := repo.GetByID(ctx, fixture.ID)
		require.NoError(t, err)
		require.Nil(t, roundTrip.Mode)
		require.Nil(t, roundTrip.SelectedParts)
		require.Nil(t, roundTrip.ExamTestID)
	}
	count, err := repo.CountCompleted(ctx, attempt.UserID)
	require.NoError(t, err)
	require.EqualValues(t, 1, count, "video, exam, standalone, unfinished, abandoned and other users must not count as completed lessons")
	lessons, err := repo.ListLessonAttempts(ctx, attempt.UserID)
	require.NoError(t, err)
	require.Len(t, lessons, 1)
	videos, err := repo.ListCompletedVideo(ctx, attempt.UserID, []string{video.ID})
	require.NoError(t, err)
	require.Len(t, videos, 1)
	var empty pq.Int64Array
	require.NoError(t, tx.Raw("SELECT '{}'::smallint[]").Row().Scan(&empty))
	require.NotNil(t, empty, "SQL empty array must remain distinct from NULL")
	require.Empty(t, empty)
}

func TestExamCategoryMigration(t *testing.T) {
	db := examMigrationDB(t)
	cases := []struct {
		name string
		run  func(*testing.T, *gorm.DB, *models.ExamTest)
	}{
		{"unique category slug", func(t *testing.T, tx *gorm.DB, exam *models.ExamTest) {
			var category models.ExamCategory
			require.NoError(t, tx.First(&category, "id = ?", exam.CategoryID).Error)
			category.ID = ""
			var pgErr *pgconn.PgError
			require.ErrorAs(t, tx.Create(&category).Error, &pgErr)
			require.Equal(t, "23505", pgErr.Code)
		}},
		{"restrict category deletion", func(t *testing.T, tx *gorm.DB, exam *models.ExamTest) {
			var pgErr *pgconn.PgError
			require.ErrorAs(t, tx.Delete(&models.ExamCategory{}, "id = ?", exam.CategoryID).Error, &pgErr)
			require.Contains(t, []string{"23001", "23503"}, pgErr.Code)
			require.Equal(t, "exam_tests_category_id_fkey", pgErr.ConstraintName)
		}},
		{"multiple tests per category", func(t *testing.T, tx *gorm.DB, exam *models.ExamTest) {
			second := *exam
			second.ID, second.SourceKey, second.Slug = "", uuid.NewString(), uuid.NewString()
			require.NoError(t, tx.Create(&second).Error)
			var count int64
			require.NoError(t, tx.Model(&models.ExamTest{}).Where("category_id = ?", exam.CategoryID).Count(&count).Error)
			require.EqualValues(t, 2, count)
		}},
		{"category relation reads without auto-saving", func(t *testing.T, tx *gorm.DB, exam *models.ExamTest) {
			var loaded models.ExamTest
			require.NoError(t, tx.Joins("Category").First(&loaded, "exam_tests.id = ?", exam.ID).Error)
			require.NotNil(t, loaded.Category)
			require.Equal(t, enums.ExamTypeTOEIC, loaded.Category.Type)
			original := *loaded.Category
			loaded.Category.Title, loaded.Category.Slug = "must not persist", uuid.NewString()
			require.NoError(t, tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(&loaded).Error)
			var stored models.ExamCategory
			require.NoError(t, tx.First(&stored, "id = ?", exam.CategoryID).Error)
			require.Equal(t, original.Title, stored.Title)
			require.Equal(t, original.Slug, stored.Slug)
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			tx, exam, _ := examMigrationFixture(t, db)
			tc.run(t, tx, exam)
		})
	}
}
