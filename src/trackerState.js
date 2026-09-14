(function (globalScope) {
  const MAX_DAYS = 75;

  const TASKS = [
    "45 minute outdoor workout",
    "45 minute workout (indoor or outdoor)",
    "Drink a gallon of water",
    "Read 10 pages of nonfiction",
    "Take a progress picture",
    "Stick to a diet"
  ];

  const MEMBERS = [
    { id: "ava", name: "Ava", avatar: "🦊", day: 0 },
    { id: "luna", name: "Luna", avatar: "🐰", day: 0 },
    { id: "milo", name: "Milo", avatar: "🐻", day: 0 }
  ];

  function createDefaultState() {
    return {
      members: MEMBERS.map((member) => ({ ...member })),
      tasks: TASKS.map((name, index) => ({ id: `task-${index + 1}`, name })),
      completions: {}
    };
  }

  function normalizeState(state) {
    const safe = state && typeof state === "object" ? state : {};
    const members = Array.isArray(safe.members) ? safe.members : createDefaultState().members;
    const tasks = Array.isArray(safe.tasks) ? safe.tasks : createDefaultState().tasks;
    const completions = safe.completions && typeof safe.completions === "object" ? safe.completions : {};

    return {
      members: members.map((member, index) => ({
        id: member.id || `member-${index}`,
        name: member.name || `Member ${index + 1}`,
        avatar: member.avatar || "✨",
        day: Number.isFinite(member.day) ? clamp(member.day, 0, MAX_DAYS) : 0
      })),
      tasks: tasks.map((task, index) => ({
        id: task.id || `task-${index + 1}`,
        name: task.name || `Task ${index + 1}`
      })),
      completions
    };
  }

  function setTaskCompletion(state, memberId, taskId, done) {
    const next = structuredClone(state);
    if (!next.completions[memberId]) {
      next.completions[memberId] = {};
    }
    next.completions[memberId][taskId] = Boolean(done);
    return next;
  }

  function setMemberName(state, memberId, name) {
    return {
      ...state,
      members: state.members.map((member) =>
        member.id === memberId ? { ...member, name: (name || "").trim() || member.name } : member
      )
    };
  }

  function adjustMemberDay(state, memberId, change) {
    return {
      ...state,
      members: state.members.map((member) =>
        member.id === memberId ? { ...member, day: clamp(member.day + change, 0, MAX_DAYS) } : member
      )
    };
  }

  function resetMember(state, memberId) {
    const next = structuredClone(state);
    next.members = next.members.map((member) =>
      member.id === memberId ? { ...member, day: 0 } : member
    );
    next.completions[memberId] = {};
    return next;
  }

  function isTaskDone(state, memberId, taskId) {
    return Boolean(state.completions[memberId] && state.completions[memberId][taskId]);
  }

  function allTasksDoneForMember(state, memberId) {
    return state.tasks.every((task) => isTaskDone(state, memberId, task.id));
  }

  function completeDay(state, memberId) {
    if (!allTasksDoneForMember(state, memberId)) {
      return state;
    }

    let next = adjustMemberDay(state, memberId, 1);
    next = structuredClone(next);
    next.completions[memberId] = {};
    return next;
  }

  function getTeamDay(state) {
    if (!state.members.length) {
      return 0;
    }
    return Math.min(...state.members.map((member) => member.day));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const api = {
    MAX_DAYS,
    createDefaultState,
    normalizeState,
    setTaskCompletion,
    setMemberName,
    adjustMemberDay,
    resetMember,
    isTaskDone,
    allTasksDoneForMember,
    completeDay,
    getTeamDay
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.trackerState = api;
})(typeof window !== "undefined" ? window : globalThis);
