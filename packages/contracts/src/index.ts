// Shared API contracts. Generated files are produced by `tygo generate`
// in apps/api — do not edit them by hand. Shared hand-written helpers
// may live in this package alongside the barrel.
//
// tygo has no cross-package type resolution, so apps/api/tygo.yaml maps
// every `enums.*` type and `common.ListParams` to the bare names below.
// These ambient aliases make those names resolvable inside the generated
// files (which carry no imports — no frontmatter). They live here, not in a
// standalone globals.d.ts, because this barrel is the package entry point
// and is therefore always part of a consumer's TS program. Keep this list
// in sync with apps/api/internal/common/enums and common.ListParams.
import type * as Common from './common.ts';
import type * as Enums from './enums.ts';

declare global {
  type ActivityType = Enums.ActivityType;
  type AttemptType = Enums.AttemptType;
  type CEFR = Enums.CEFR;
  type ConversationMode = Enums.ConversationMode;
  type ConversationStatus = Enums.ConversationStatus;
  type Goal = Enums.Goal;
  type InterestTopic = Enums.InterestTopic;
  type LessonStatus = Enums.LessonStatus;
  type Level = Enums.Level;
  type ListParams = Common.ListParams;
  type ScenarioDifficulty = Enums.ScenarioDifficulty;
  type TurnRole = Enums.TurnRole;
  type VocabularyDomain = Enums.VocabularyDomain;
  type VocabularySort = Enums.VocabularySort;
  type VocabularySource = Enums.VocabularySource;
  type WordMarkStatus = Enums.WordMarkStatus;
}

export * from './common.ts';
export * from './enums.ts';
export * from './profiles-requests.ts';
export * from './profiles-responses.ts';
export * from './lessons-requests.ts';
export * from './lessons-responses.ts';
export * from './personas-requests.ts';
export * from './personas-responses.ts';
export * from './conversations-requests.ts';
export * from './conversations-responses.ts';
export * from './vocabulary-requests.ts';
export * from './vocabulary-responses.ts';
export * from './attempts-requests.ts';
export * from './attempts-responses.ts';
