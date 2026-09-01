// Air-raid alert status.
//
// The dashboard's rule (see components/FeedState.tsx) is that a panel must never
// assert "nothing is happening" when it means "we cannot currently see". The
// alert panel is where that distinction matters most: a green ALL CLEAR during
// an upstream outage is a false negative on the one feed a reader would act on.
//
// An empty alert list has three quite different causes, and they must not share
// a status:
//
//   CLEAR        provider answered, genuinely nothing active
//   UNAVAILABLE  provider configured but the fetch failed or returned non-2xx
//   NO_SOURCE    this theater has no public air-raid mirror at all

export type AlertStatus = 'ACTIVE' | 'CLEAR' | 'UNAVAILABLE' | 'NO_SOURCE';

export interface AlertStatusInput {
  /** Does this theater configure an alert provider at all? */
  hasProvider: boolean;
  /** Did the upstream fetch succeed (2xx and parsed)? */
  fetchOk: boolean;
  /** Alerts to display, including anything still inside the sticky window. */
  activeCount: number;
}

export function deriveAlertStatus({
  hasProvider,
  fetchOk,
  activeCount,
}: AlertStatusInput): AlertStatus {
  if (!hasProvider) return 'NO_SOURCE';
  // Known alerts win over a failed refresh: a siren we saw 30 seconds ago is
  // still the most important thing on screen, even if the next poll failed.
  if (activeCount > 0) return 'ACTIVE';
  if (!fetchOk) return 'UNAVAILABLE';
  return 'CLEAR';
}
