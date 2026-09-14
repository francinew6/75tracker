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

  const MEMBER_SEEDS = [
    ["francine", "Francine", "https://github.com/user-attachments/assets/0671d73e-5f27-4303-b540-7ad98cbb0414"],
    ["jake", "Jake", "https://github.com/user-attachments/assets/9b579c14-a975-4e4c-95e4-f851b3be6616"],
    ["akai", "Akai", "https://github.com/user-attachments/assets/34df0349-42e9-484d-a28b-27d96d621eec"],
    ["naveen", "Naveen", "https://github.com/user-attachments/assets/b7455fda-6970-4c1c-b05f-933de282b04d"],
    ["kaustubh", "Kaustubh", "https://github.com/user-attachments/assets/0b67260f-6621-420d-9d8c-441300a19c52"],
    ["rebekah", "Rebekah", "https://github.com/user-attachments/assets/5e605244-a9f0-4aac-987d-6846463e811b"],
    ["victoria", "Victoria", "https://github.com/user-attachments/assets/119873d2-151a-407f-97c6-b10368aecbeb"],
    ["jack", "Jack", "https://github.com/user-attachments/assets/863fb412-40f6-495d-88a7-2fc00bf18a84"],
    ["samanyu", "Samanyu", "https://github.com/user-attachments/assets/82ae5743-b5f6-47a1-b02e-6329d522f0e9"],
    ["varun", "Varun", "https://github.com/user-attachments/assets/9b9b4d09-3379-4c1a-9bd2-a954657b8db2"]
  ];

  function createDefaultState() {
    return {
      members: MEMBER_SEEDS.map(([id, name, avatar]) => ({ id, name, avatar, day: 0 })),
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
        avatar: member.avatar || defaults.members[0].avatar,
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

  function setMemberAvatar(state, memberId, avatarUrl) {
    return {
      ...state,
      members: state.members.map((member) =>
        member.id === memberId ? { ...member, avatar: avatarUrl || member.avatar } : member
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
      avatar: avatar || next.members[0].avatar,
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
    setMemberAvatar,
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
