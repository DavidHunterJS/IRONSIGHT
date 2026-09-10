# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Open

### Next up

- [ ] **Two more Google News searches now contribute almost nothing.** Google returns a search's results by relevance, not date, so a query without a `when:` bound fills its 15 slots with whatever ranks best, however old. The age window (#30) then discards the old ones. Measured 2026-09-10 across all 16 unbounded searches, first 15 items each:
  - `armed conflict OR military offensive OR airstrike` (global): 2 of 15 under 14 days, median 21 days, oldest 120.
  - `North Korea missile OR ICBM test`: 2 of 15, median 21 days, oldest 76.
  - `ceasefire OR peace talks OR UN Security Council` (global): 8 of 15, oldest 101.
  - The other 13 keep 12-15 of 15. `DMZ OR inter-Korean...` (oldest 25), `Iran Israel war military` (20) and `South China Sea Philippines China` (52) each lose one to three.

  A `when:7d` bound is the likely fix, but it has to be measured per query: `Taiwan Strait PLA incursion when:7d` returned nothing at all, and was reworded rather than bounded (#32).

### Clustering

- [ ] **One outlet's daily tallies merge into one row.** The tokenizer drops words of two characters or fewer, which takes every number below 100 with it, so 'Taiwan tracks 18 Chinese military aircraft, 9 ships' and 'Taiwan tracks 12 Chinese ships, 8 military aircraft' score 1.000 - identical - and two days' counts from Taiwan News collapse into one row. Taiwan's defence ministry titles every daily report 'PLA activities in the waters and airspace around Taiwan', so three days of those merge too. Same-outlet clusters show no badge, so the older tallies vanish with nothing to say they arrived. Surfaced by the `PLA aircraft Taiwan` query (#32), which carries both series. The lead is always the newest, so the panel shows the latest count; what is lost is the count before it. Short numbers may be worth keeping as tokens for same-outlet comparison only - across outlets, differing casualty figures are exactly what should still match.

- [ ] **Clustering thresholds still rest on one day of data.** Re-measured 2026-09-09 against the fixed tokenizer: `SIMILARITY_THRESHOLD` moved 0.45 -> 0.42, and a separate `SAME_OUTLET_THRESHOLD` (0.55) was added because one outlet against itself at ~0.43 is usually the next instalment of a series, not the same piece twice. Both are floors rather than dials now, and the code carries the measurements. Below 0.42 the same-story and different-story pairs overlap (0.417 holds both), so lowering it starts hiding events; the margin is 0.003. Worth re-running the measurement once there is more than a single snapshot - the method is in #26.

### Feed health

- [ ] **CENTCOM is the last feed the staleness check flags.** `npm run check:links` reports it every sweep and exits 1 until it is dealt with. (CNN was removed in #29; the Taiwan Strait query was reworded in #32.) It no longer reaches a panel: the 14-day age window (#30) drops all fifteen of its rows. Measured live, those rows were on **red-sea** (rows 48-62 of 62, 217-329 days old), not iran-israel as first recorded - iran-israel has 100 newer items, so CENTCOM never survived its slice. What is left is only whether to keep a feed that contributes nothing while quiet and comes back on its own if it resumes, or drop it so the checker goes green.
- [ ] **Nikkei Asia carries no dates at all.** Its RSS 1.0 items have a title and a link and nothing else - no date at item or channel level, so there is no field to read (#31 checked every configured feed; Nikkei and Taipei Times were the only two arriving undated, and only Taipei Times had a date to find). It contributes no rows today only because none of its 15 headlines on 2026-09-10 passed the taiwan-china or north-korea relevance filters. When one does, it will be kept by the age window and sort below every dated row. Options: date items by when we first saw them (needs state the route does not have), or leave it and accept the sort position.
- [ ] **Walla and JPost timestamps run up to ~3 hours in the future.** Measured 2026-09-10: 11 iran-israel rows dated 0.1-2.6 hours ahead, all Walla or JPost, all labelled `GMT`. The size fits Israel local time (UTC+3 in summer) written with the wrong zone. The recency sort uses distance from now in either direction, so a mislabelled item ranks as if it were hours older than it is, and `timeAgo` prints the absolute value. Not an age problem, so the age window leaves future dates alone.
- [ ] **38 North may be failing from Vercel only.** The live north-korea panel reported `20/21` sources and carried no 38 North rows; a local build on the same day reported `21/21` and served seven. One reading - confirm with `check:links` and a second live sample before concluding it blocks datacenter addresses.
- [ ] **Re-check the theaters that lean on one source.** taiwan-china now runs without a second Chinese state outlet after China Daily was dropped; Global Times is the only one left. Worth a look at whether other theaters have a similarly thin slot.

### Backlog (from the original brief)

- [ ] OSINT source reliability indicators
- [ ] Timeline view
- [ ] Search
- [ ] Source filters
- [ ] Saved watchlists
- [ ] Global event map
- [ ] Breaking-event alerts
- [ ] Historical archive
- [ ] Mobile layout
- [ ] AI-generated summaries
- [ ] Financial impact panels

---

## Done

- [x] ~~Replace the CARTO basemap, which now watermarks anonymous tiles with "API KEY REQUIRED"~~ ✅ done 2026-09-09 (#17)
- [x] ~~Send PressTV links to the host with a valid certificate~~ ✅ done 2026-09-09 (#18)
- [x] ~~Add a feed link checker that opens what readers click~~ ✅ done 2026-09-09 (#19)
- [x] ~~Drop China Daily's dead feed and fix the ThreatClock lint error~~ ✅ done 2026-09-09 (#20)
- [x] ~~Retry the link checker's network failures so transient resets stop reading as breakage~~ ✅ done 2026-09-09 (#21)
- [x] ~~Show the outlet that wrote an aggregated story, not the aggregator~~ ✅ done 2026-09-09 (#22)
- [x] ~~Duplicate-story clustering, with a corroboration count~~ ✅ done 2026-09-09 (#23)
- [x] ~~Distinguish a syndicated wire pickup from independent corroboration~~ ✅ done 2026-09-09 (#25)
- [x] ~~Re-measure the clustering threshold against the fixed tokenizer~~ ✅ done 2026-09-09 (#26)
- [x] ~~Mark who owns a source, rather than rating how much to trust it~~ ✅ done 2026-09-09 (#27)
- [x] ~~Flag feeds nobody publishes to any more~~ ✅ done 2026-09-09 (#28)
- [x] ~~Remove CNN's dead Middle East feed, retiring the last HTTPS exemption~~ ✅ done 2026-09-09 (#29)
- [x] ~~Drop news items older than 14 days, so thin theaters stop backfilling with archive~~ ✅ done 2026-09-10 (#30)
- [x] ~~Read Taipei Times' `<dc:date>`, through one date reader shared by the route and the link checker~~ ✅ done 2026-09-10 (#31)
- [x] ~~Reword the Taiwan Strait query, which matched only 2022-2025 results, to `PLA aircraft Taiwan when:7d`~~ ✅ done 2026-09-10 (#32)
