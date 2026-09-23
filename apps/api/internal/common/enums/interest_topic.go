package enums

// InterestTopic is an onboarding topic preference
// (user_profiles.preferences.topics[]).
type InterestTopic string

const (
	InterestTopicTravel     InterestTopic = "travel"
	InterestTopicBusiness   InterestTopic = "business"
	InterestTopicMoviesTV   InterestTopic = "movies_tv"
	InterestTopicTechnology InterestTopic = "technology"
	InterestTopicFood       InterestTopic = "food"
	InterestTopicMusic      InterestTopic = "music"
	InterestTopicSports     InterestTopic = "sports"
	InterestTopicNews       InterestTopic = "news"
)
