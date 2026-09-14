(function (globalScope) {
  const MAX_DAYS = 75;
  const ROLLOVER_HOUR = 4;

  const TASKS = [
    "45 minute outdoor workout",
    "45 minute workout (indoor or outdoor)",
    "Drink a gallon of water",
    "Read 10 pages of nonfiction",
    "Take a progress picture",
    "Stick to a diet"
  ];

  const MEMBERS = [
    { id: "francine", name: "Francine", avatar: "🦊", day: 0 },
    { id: "jake", name: "Jake", avatar: "🦁", day: 0 },
    { id: "akai", name: "Akai", avatar: "🐯", day: 0 },
    { id: "naveen", name: "Naveen", avatar: "🐼", day: 0 },
    { id: "kaustubh", name: "Kaustubh", avatar: "🦉", day: 0 },
    { id: "rebekah", name: "Rebekah", avatar: "🐰", day: 0 },
    { id: "victoria", name: "Victoria", avatar: "🦋", day: 0 },
    { id: "jack", name: "Jack", avatar: "🐻", day: 0 },
    { id: "samanyu", name: "Samanyu", avatar: "🐨", day: 0 },
    { id: "varun", name: "Varun", avatar: "🐸", day: 0 }
  ];

  function createDefaultState() {
    return {
      members: MEMBERS.map((member) => ({ ...member })),
      tasks: TASKS.map((name, index) => ({ id: `task-${index + 1}`, name })),
      completions: {},
      dayKey: getChallengeDayKey(new Date(), ROLLOVER_HOUR)
    };
  }

  function normalizeState(state) {
    const safe = state && typeof state === "object" ? state : {};
    const defaults = createDefaultState();
    const members = Array.isArray(safe.members) ? safe.members : defaults.members;
    const tasks = Array.isArray(safe.tasks) ? safe.tasks : defaults.tasks;
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
      completions,
      dayKey: typeof safe.dayKey === "string" && safe.dayKey ? safe.dayKey : defaults.dayKey
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

  function addMember(state, name, avatar) {
    const safeName = (name || "").trim();
    if (!safeName) {
      return state;
    }

    const next = structuredClone(state);
    const baseId = slugify(safeName) || "member";
    let uniqueId = baseId;
    let suffix = 2;

    while (next.members.some((member) => member.id === uniqueId)) {
      uniqueId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    next.members.push({
      id: uniqueId,
      name: safeName,
      avatar: (avatar || "🐣").trim() || "🐣",
      day: 0
    });

    return next;
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

  function applyDailyRollover(state, options) {
    const normalized = normalizeState(state);
    const now = options && options.now ? options.now : new Date();
    const rolloverHour = options && Number.isInteger(options.rolloverHour) ? options.rolloverHour : ROLLOVER_HOUR;
    const currentDayKey = getChallengeDayKey(now, rolloverHour);

    if (normalized.dayKey === currentDayKey) {
      return normalized;
    }

    const next = structuredClone(normalized);

    next.members = next.members.map((member) => ({
      ...member,
      day: allTasksDoneForMember(normalized, member.id) ? clamp(member.day + 1, 0, MAX_DAYS) : member.day
    }));

    next.completions = next.members.reduce((acc, member) => {
      acc[member.id] = {};
      return acc;
    }, {});
    next.dayKey = currentDayKey;

    return next;
  }

  function getTeamDay(state) {
    if (!state.members.length) {
      return 0;
    }
    return Math.min(...state.members.map((member) => member.day));
  }

  function getChallengeDayKey(date, rolloverHour) {
    const safeDate = date instanceof Date ? date : new Date(date);
    const shifted = new Date(safeDate);
    shifted.setHours(shifted.getHours() - rolloverHour, 0, 0, 0);

    const year = shifted.getFullYear();
    const month = String(shifted.getMonth() + 1).padStart(2, "0");
    const day = String(shifted.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const api = {
    MAX_DAYS,
    ROLLOVER_HOUR,
    createDefaultState,
    normalizeState,
    setTaskCompletion,
    setMemberName,
    addMember,
    resetMember,
    isTaskDone,
    allTasksDoneForMember,
    applyDailyRollover,
    getTeamDay,
    getChallengeDayKey
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.trackerState = api;
})(typeof window !== "undefined" ? window : globalThis);
