package enums

// Goal is the onboarding primary goal (user_profiles.preferences.primary_goal).
type Goal string

const (
	GoalTravel Goal = "travel"
	GoalWork   Goal = "work"
	GoalExams  Goal = "exams"
	GoalDaily  Goal = "daily"
	GoalFun    Goal = "fun"
)
