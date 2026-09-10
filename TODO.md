# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Open

### Next up

- [ ] **The global panel now only shows the last two days.** After #36 its filtered feeds contribute about 20 current rows, and at the 100-row cap the oldest row fell from 5.9 days to 2.0. What gave way was mostly defence trade press - USNI 13 rows to 7, War on the Rocks 13 to 7 - but it included real reporting: Long War Journal's 'Iran continues attacks on Kurdish opposition group in northern Iraq' and 'Israel claims control of Ali al Taher', and Fox's 'NATO member boots 10 Russian diplomats', all two to four days old. The cap is recency-only, so a worldwide panel always saturates. Options worth measuring: a higher cap for global, a per-source ceiling so one busy wire cannot take thirty rows, or accepting that global is a last-48-hours view.

### Relevance filters

- [ ] **Global still misses conflict stories that only name a place.** After #36 it catches 33 of the 47 conflict items its feeds carried on 2026-09-10. What it misses names a country or a person rather than an act: 'Poland says it expects Russia will target its border crossings with Ukraine', 'Putin Meets Trump Envoys as U.S. Pushes to Revive Ukraine Peace Talks', 'Ukraine's Next Goal Is to Shut Down Russia's Commercial Airspace'. Adding the regional theaters' place filters caught 44 of 47 but with 52 false hits, and was rejected. Revisit only with a narrower idea than geography.
- [ ] **NYT's own topic tags now admit a few items.** The route tests an item's `<category>` as well as its title, and among global's filtered feeds only NYT, Al Jazeera and Fox carry one. With 'invasion' and 'war' in the global filter, NYT's tags 'Russian Invasion of Ukraine (2022)' and 'War and Armed Conflicts' let in three items on 2026-09-10 whose titles did not match: German far-right messaging, Ukraine's budget gap, and an op-ed on West Bank impunity. Small, and it is the outlet's own classification - but it is a path the title measurements did not see.
- [ ] **Two one-word gaps in regional filters.** russia-ukraine dropped 'Rosneft's Ryazan Oil Refinery Shuts Down After Drone Attack' (Moscow Times) - Ryazan is not in its place list, and no place list is ever complete. red-sea dropped Splash 247's 'Hormuz attacks reach wartime high' - it matches 'strait of hormuz' but not bare 'Hormuz'. Found reading every conflict-worded drop across the four regional theaters (#35); everything else those filters dropped belonged to another theater.

### Google News searches

- [ ] **Off-topic journalism still reaches the global panel through its two broad searches.** After #34 removed the sites that publish no news, the global searches still carried a 19FortyFive piece on a Patton quote, Brookings on military AI, and FT and SCMP stories about trade 'truces' - roughly 5 of 30. There is no safe pattern for these: 'truce' also brings in the Kremlin dismissing an aerial truce and a 3-day truce ending in Kyiv. Relevance-filtering the searches was measured and rejected (#34): the global filter would have dropped 13 real reports and still passed the Disney+ listing on the word 'ceasefire'. The five regional theaters' searches were nearly clean (about 4 non-news items in 218, all reference pages). Accept it, or narrow global's wording further.
- [ ] **A dropped search item still uses one of the feed's 15 slots.** The news route reads the first 15 elements and skips unusable ones inside that count, so an item dropped as not-news (#34) or for having no title is not replaced by the 16th. Harmless at today's rate - two or three a day across all searches - but worth knowing before adding more exclusions.

- [ ] **Three searches were left unbounded on purpose (#33).** `DMZ OR inter-Korean...` lost 3 of 15 items to the age window, `Iran Israel war military` 2-3, `South China Sea Philippines China` 1. Bounding was measured and not applied: on a busy search `when:7d` makes results *older*, because Google stops favouring fresh items and ranks the whole week by relevance (`"Strait of Hormuz" OR "Red Sea" military` went from a 0.6-day median to 4.1, `Russia Ukraine war military` 0.4 to 2.6). A bound belongs only where a search is backfilling with archive. Re-measure if any of these three starts losing more.

### Clustering

- [ ] **One outlet's daily tallies merge into one row.** The tokenizer drops words of two characters or fewer, which takes every number below 100 with it, so 'Taiwan tracks 18 Chinese military aircraft, 9 ships' and 'Taiwan tracks 12 Chinese ships, 8 military aircraft' score 1.000 - identical - and two days' counts from Taiwan News collapse into one row. Taiwan's defence ministry titles every daily report 'PLA activities in the waters and airspace around Taiwan', so three days of those merge too. Same-outlet clusters show no badge, so the older tallies vanish with nothing to say they arrived. Surfaced by the `PLA aircraft Taiwan` query (#32), which carries both series. The lead is always the newest, so the panel shows the latest count; what is lost is the count before it. Short numbers may be worth keeping as tokens for same-outlet comparison only - across outlets, differing casualty figures are exactly what should still match.

- [ ] **Clustering thresholds still rest on one day of data.** Re-measured 2026-09-09 against the fixed tokenizer: `SIMILARITY_THRESHOLD` moved 0.45 -> 0.42, and a separate `SAME_OUTLET_THRESHOLD` (0.55) was added because one outlet against itself at ~0.43 is usually the next instalment of a series, not the same piece twice. Both are floors rather than dials now, and the code carries the measurements. Below 0.42 the same-story and different-story pairs overlap (0.417 holds both), so lowering it starts hiding events; the margin is 0.003. Worth re-running the measurement once there is more than a single snapshot - the method is in #26.

### Feed health

- [ ] **CENTCOM is the last feed the staleness check flags.** `npm run check:links` reports it every sweep and exits 1 until it is dealt with. (CNN was removed in #29; the Taiwan Strait query was reworded in #32.) It no longer reaches a panel: the 14-day age window (#30) drops all fifteen of its rows. Measured live, those rows were on **red-sea** (rows 48-62 of 62, 217-329 days old), not iran-israel as first recorded - iran-israel has 100 newer items, so CENTCOM never survived its slice. What is left is only whether to keep a feed that contributes nothing while quiet and comes back on its own if it resumes, or drop it so the checker goes green.
- [ ] **Nikkei Asia carries no dates at all.** Its RSS 1.0 items have a title and a link and nothing else - no date at item or channel level, so there is no field to read (#31 checked every configured feed; Nikkei and Taipei Times were the only two arriving undated, and only Taipei Times had a date to find). It contributes no rows today only because none of its 15 headlines on 2026-09-10 passed the taiwan-china or north-korea relevance filters. When one does, it will be kept by the age window and sort below every dated row. Options: date items by when we first saw them (needs state the route does not have), or leave it and accept the sort position.
- [ ] **Walla and JPost timestamps run up to ~3 hours in the future.** Measured 2026-09-10: 11 iran-israel rows dated 0.1-2.6 hours ahead, all Walla or JPost, all labelled `GMT`. The size fits Israel local time (UTC+3 in summer) written with the wrong zone. The recency sort uses distance from now in either direction, so a mislabelled item ranks as if it were hours older than it is, and `timeAgo` prints the absolute value. Not an age problem, so the age window leaves future dates alone.
- [ ] **Korea Times' feed went empty on 2026-09-10.** The configured `https://www.koreatimes.co.kr/www/rss/nation.xml` now 301s to `https://feed.koreatimes.co.kr/k/southkorea.xml`, which answers 200 with a well-formed channel and no items, so `check:links -- --conflict=north-korea` exits 1 ("feed parsed but yielded no item links"). The same URL returned 15 dated items earlier that day, so this may be a migration in progress rather than a dead feed. One reading - re-check before replacing the URL.
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
- [x] ~~Bound the three Google News searches the age window was emptying, and reword the ceasefire search~~ ✅ done 2026-09-10 (#33)
- [x] ~~Drop search results from sites that publish no news (Britannica, Disney+)~~ ✅ done 2026-09-10 (#34)
- [x] ~~Match 'N. Korea' in the north-korea filter, and plurals and 'counteroffensive' in the global one~~ ✅ done 2026-09-10 (#35)
- [x] ~~Give the global filter the vocabulary the major outlets headline wars with~~ ✅ done 2026-09-10 (#36)
