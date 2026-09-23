import type { Preferences, Profile } from "@engflex/contracts";
import { Store } from "@tanstack/store";
import { PROFILE } from "./fixtures";

/** Reactive mock state: onboarding (Spec 2) writes, sidebar reads. */
export const profileStore = new Store<{ profile: Profile }>({
	profile: PROFILE,
});

export function setPreferences(preferences: Preferences): void {
	profileStore.setState((state) => ({
		profile: {
			...state.profile,
			preferences,
			onboardingCompletedAt:
				state.profile.onboardingCompletedAt ?? state.profile.updatedAt,
		},
	}));
}
