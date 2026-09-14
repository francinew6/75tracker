const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createDefaultState,
  setTaskCompletion,
  allTasksDoneForMember,
  completeDay,
  resetMember,
  adjustMemberDay,
  getTeamDay,
  MAX_DAYS
} = require("../src/trackerState");

test("completeDay only advances when every task is checked", () => {
  const state = createDefaultState();
  const member = state.members[0];

  let next = setTaskCompletion(state, member.id, state.tasks[0].id, true);
  assert.equal(allTasksDoneForMember(next, member.id), false);
  assert.equal(completeDay(next, member.id).members[0].day, 0);

  for (const task of state.tasks) {
    next = setTaskCompletion(next, member.id, task.id, true);
  }

  assert.equal(allTasksDoneForMember(next, member.id), true);
  const completed = completeDay(next, member.id);
  assert.equal(completed.members[0].day, 1);
  assert.deepEqual(completed.completions[member.id], {});
});

test("resetMember restarts day counter and clears checklist", () => {
  let state = createDefaultState();
  const member = state.members[1];
  state = setTaskCompletion(state, member.id, state.tasks[0].id, true);
  state = adjustMemberDay(state, member.id, 9);

  const reset = resetMember(state, member.id);
  assert.equal(reset.members[1].day, 0);
  assert.deepEqual(reset.completions[member.id], {});
});

test("day counter bounds and team day are stable", () => {
  let state = createDefaultState();
  const [first, second] = state.members;

  state = adjustMemberDay(state, first.id, MAX_DAYS + 10);
  state = adjustMemberDay(state, second.id, 10);
  state = adjustMemberDay(state, second.id, -20);

  assert.equal(state.members[0].day, MAX_DAYS);
  assert.equal(state.members[1].day, 0);
  assert.equal(getTeamDay(state), 0);
});
