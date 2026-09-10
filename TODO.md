# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Open

### Next up

- [ ] **Taipei Times serves every item undated.** Its feed is RSS 1.0 and dates items in `<dc:date>`, which the news route does not read (it tries `pubDate`, `published`, `updated`, then the channel's `lastBuildDate`, which this feed does not carry). All 15 of its current headlines - "Drone intrusion temporarily shuts Taichung air base" among them - show no time and sort below every dated row in taiwan-china. The link checker already parses `dc:date` for exactly this feed; the route needs the same. The age window deliberately keeps undated items so this bug costs a sort position rather than the whole source. Found while measuring the window (2026-09-10).

### Clustering

- [ ] **Clustering thresholds still rest on one day of data.** Re-measured 2026-09-09 against the fixed tokenizer: `SIMILARITY_THRESHOLD` moved 0.45 -> 0.42, and a separate `SAME_OUTLET_THRESHOLD` (0.55) was added because one outlet against itself at ~0.43 is usually the next instalment of a series, not the same piece twice. Both are floors rather than dials now, and the code carries the measurements. Below 0.42 the same-story and different-story pairs overlap (0.417 holds both), so lowering it starts hiding events; the margin is 0.003. Worth re-running the measurement once there is more than a single snapshot - the method is in #26.

### Feed health

- [ ] **Two feeds the staleness check flags are still in the config.** `npm run check:links` reports them every sweep and exits 1 until they are dealt with. (CNN was the third; removed in #29.)
  - **CENTCOM** no longer reaches a panel: the 14-day age window (#30) drops all fifteen of its rows. Measured live, those rows were on **red-sea** (rows 48-62 of 62, 217-329 days old), not iran-israel as first recorded - iran-israel has 100 newer items, so CENTCOM never survived its slice. What is left is only whether to keep a feed that contributes nothing while quiet and comes back on its own if it resumes, or drop it so the checker goes green.
  - **`Taiwan Strait PLA incursion`** does match things - it matches nothing *recent*. Its results were 2022-2025 think-tank pieces (Global Taiwan Institute, CFR, Jamestown), the oldest 1562 days, filling taiwan-china rows 57-64. The age window now hides them, so the query contributes nothing. It wants rewording, and probably a `when:7d` bound like the Reuters queries already carry, which would have kept those results out in the first place.
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
