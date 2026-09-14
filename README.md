# 75tracker

A cute collaborative 75-day challenge tracker with:

- Team member cards with names, avatars, and day counters (`0/75` to `75/75`)
- A shared daily task board for all required challenge tasks
- Per-person task check-offs so everyone can see who has completed what
- Automatic 4am rollover that clears checklists and advances each completed member's day count
- Server-backed shared state so everyone using the same app sees the same progress
- A floating Caitlyn rabbit avatar button for encouragement confetti

## Run locally

```bash
npm test
npm start
```

Open `http://localhost:4173`.


Asset catalogs are defined in `/avatars/catalog.js` and `/background/catalog.js`.
