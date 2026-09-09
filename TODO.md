# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Open

### Next up

- [ ] **Duplicate-story clustering.** The six theaters share wire feeds - BBC, NYT, Al Jazeera and Reuters appear in several configs, and the Google News queries return heavy near-duplicates - so the same story arrives repeatedly in one panel. The largest signal-to-noise win left, and the concern behind most fixes in this codebase. Start with the design question (what counts as the same story?) rather than the code.

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
