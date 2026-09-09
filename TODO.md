# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Open

### Next up

- [ ] **A syndicated wire story counts as many sources.** Clustering counts distinct outlets, which is right for independent reporting and wrong for syndication. Live production shows `Anadolu Ajansı +6` on one South China Sea story, where Goshen News, Oskaloosa Herald, Ottumwa Courier and Temple Daily are CNHI papers all running the same AP copy - seven "sources" that are one report. The count overstates corroboration wherever a wire gets picked up, which is the case it most needs to get right. No cheap fix: telling syndication from independent reporting is harder than the matching that produced the cluster. Identical titles across outlets are a strong hint, and a byline or wire credit would be stronger if the feeds carried one. Surfaced by inspecting every cluster on the day clustering shipped (2026-09-09).

### Clustering

- [ ] **Clustering thresholds still rest on one day of data.** Re-measured 2026-09-09 against the fixed tokenizer: `SIMILARITY_THRESHOLD` moved 0.45 -> 0.42, and a separate `SAME_OUTLET_THRESHOLD` (0.55) was added because one outlet against itself at ~0.43 is usually the next instalment of a series, not the same piece twice. Both are floors rather than dials now, and the code carries the measurements. Below 0.42 the same-story and different-story pairs overlap (0.417 holds both), so lowering it starts hiding events; the margin is 0.003. Worth re-running the measurement once there is more than a single snapshot - the method is in #26.

### Feed health

- [ ] **The link checker cannot see a stale feed.** `npm run check:links` proves a feed responds and its articles open; it says nothing about whether anyone still publishes to it. People's Daily (`en.people.cn/rss/China.xml`) and Xinhua (`english.news.cn/rss/worldrss.xml`) both answer `200` over feeds last updated in **2011** and **2018** - a source can be frozen for a decade and pass every check. Compare the newest item date against a threshold and report anything long dead. Found while looking for a China Daily replacement (2026-09-09).
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
