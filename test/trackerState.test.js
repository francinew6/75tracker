const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createDefaultState,
  setTaskCompletion,
  setMemberAvatar,
  allTasksDoneForMember,
  applyDailyRollover,
  getChallengeDayKey,
  resetMember,
  addMember,
  getTeamDay,
  MAX_DAYS
} = require("../src/trackerState");

test("daily rollover at 4am increments completed members and clears tasks", () => {
  let state = createDefaultState();
  const member = state.members[0];

  for (const task of state.tasks) {
    state = setTaskCompletion(state, member.id, task.id, true);
  }

  const before4am = new Date("2026-09-15T03:30:00");
  state.dayKey = getChallengeDayKey(before4am, 4);

  const afterRollover = applyDailyRollover(state, {
    now: new Date("2026-09-15T04:05:00"),
    rolloverHour: 4
  });

  assert.equal(afterRollover.members[0].day, 1);
  assert.equal(afterRollover.members[1].day, 0);
  assert.deepEqual(afterRollover.completions[member.id], {});
});

test("rollover does not run twice in the same challenge day", () => {
  const now = new Date("2026-09-15T10:00:00");
  let state = createDefaultState();
  state.dayKey = getChallengeDayKey(now, 4);

  const next = applyDailyRollover(state, { now, rolloverHour: 4 });
  assert.equal(next.members[0].day, 0);
});

test("resetMember restarts day counter and clears checklist", () => {
  let state = createDefaultState();
  const member = state.members[1];

  state = setTaskCompletion(state, member.id, state.tasks[0].id, true);
  state.members[1].day = MAX_DAYS;

  const reset = resetMember(state, member.id);
  assert.equal(reset.members[1].day, 0);
  assert.deepEqual(reset.completions[member.id], {});
});

test("can add members for later challenge joiners", () => {
  const state = createDefaultState();
  const next = addMember(state, "Maddy", state.members[0].avatar);
  const added = next.members.find((member) => member.name === "Maddy");

  assert.ok(added);
  assert.equal(added.day, 0);
});

test("member avatars can be updated", () => {
  const state = createDefaultState();
  const next = setMemberAvatar(state, state.members[0].id, "https://example.com/avatar.png");
  assert.equal(next.members[0].avatar, "https://example.com/avatar.png");
});

test("default participant list includes all active challengers", () => {
  const state = createDefaultState();
  const names = state.members.map((member) => member.name);

  assert.deepEqual(names, [
    "Francine",
    "Jake",
    "Akai",
    "Naveen",
    "Kaustubh",
    "Rebekah",
    "Victoria",
    "Jack",
    "Samanyu",
    "Varun"
  ]);
  assert.equal(getTeamDay(state), 0);
  assert.equal(allTasksDoneForMember(state, state.members[0].id), false);
});
