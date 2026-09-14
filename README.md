# 75tracker

A cute collaborative 75-day challenge tracker with:

- Team member cards with names, avatars, and day counters (`0/75` to `75/75`)
- A shared daily task board for all required challenge tasks
- Per-person task check-offs so everyone can see who has completed what
- Incremental progress tracking (check some tasks now, return later for more)
- Auto-saved state in browser storage

## Run locally

```bash
npm install
npm test
python3 -m http.server 4173
```

Open `http://localhost:4173` and use `index.html`.
