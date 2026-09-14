const {
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
} = window.trackerState;

const memberCards = document.getElementById("memberCards");
const taskBoard = document.getElementById("taskBoard");
const teamCounter = document.getElementById("teamCounter");

let state = createDefaultState();

void init();

async function init() {
  state = await fetchState();
  render();
}

async function fetchState() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) {
      return createDefaultState();
    }

    const parsed = await response.json();
    return normalizeState(parsed);
  } catch {
    return createDefaultState();
  }
}

async function saveAndRender(nextState) {
  state = normalizeState(nextState);
  render();

  try {
    await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
  } catch {
  }
}

function render() {
  teamCounter.textContent = `Team shared day: ${getTeamDay(state)}/${MAX_DAYS} ✨`;
  renderMemberCards();
  renderTaskBoard();
}

function renderMemberCards() {
  memberCards.innerHTML = "";

  state.members.forEach((member) => {
    const card = document.createElement("article");
    card.className = "member-card";

    const completeForToday = allTasksDoneForMember(state, member.id);

    card.innerHTML = `
      <div class="member-head">
        <span class="avatar" aria-hidden="true">${member.avatar}</span>
        <input class="name-input" data-action="rename" data-member="${member.id}" value="${escapeHtml(member.name)}" aria-label="Name for ${escapeHtml(member.name)}" />
      </div>
      <p class="counter">Day ${member.day}/${MAX_DAYS}</p>
      <div class="actions">
        <button class="alt" data-action="minus" data-member="${member.id}">-1 day</button>
        <button class="alt" data-action="plus" data-member="${member.id}">+1 day</button>
        <button class="success" data-action="complete" data-member="${member.id}" ${completeForToday ? "" : "disabled"}>Complete day</button>
        <button data-action="reset" data-member="${member.id}">Restart</button>
      </div>
    `;

    memberCards.appendChild(card);
  });

  memberCards.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", handleAction);
  });

  memberCards.querySelectorAll("input[data-action='rename']").forEach((input) => {
    input.addEventListener("change", (event) => {
      const memberId = event.target.dataset.member;
      void saveAndRender(setMemberName(state, memberId, event.target.value));
    });
  });
}

function renderTaskBoard() {
  const headers = state.members
    .map((member) => `<th scope="col">${escapeHtml(member.name)}</th>`)
    .join("");

  const rows = state.tasks
    .map((task) => {
      const cells = state.members
        .map((member) => {
          const checked = isTaskDone(state, member.id, task.id);
          return `
            <td class="status-cell">
              <label>
                <input
                  type="checkbox"
                  data-member="${member.id}"
                  data-task="${task.id}"
                  ${checked ? "checked" : ""}
                />
                <span class="status-label ${checked ? "done" : ""}">${checked ? "Done" : "Todo"}</span>
              </label>
            </td>
          `;
        })
        .join("");

      return `<tr><th scope="row">${escapeHtml(task.name)}</th>${cells}</tr>`;
    })
    .join("");

  taskBoard.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Task</th>
        ${headers}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;

  taskBoard.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const memberId = event.target.dataset.member;
      const taskId = event.target.dataset.task;
      void saveAndRender(setTaskCompletion(state, memberId, taskId, event.target.checked));
    });
  });
}

function handleAction(event) {
  const action = event.target.dataset.action;
  const memberId = event.target.dataset.member;

  if (action === "minus") {
    void saveAndRender(adjustMemberDay(state, memberId, -1));
    return;
  }

  if (action === "plus") {
    void saveAndRender(adjustMemberDay(state, memberId, 1));
    return;
  }

  if (action === "complete") {
    void saveAndRender(completeDay(state, memberId));
    return;
  }

  if (action === "reset") {
    void saveAndRender(resetMember(state, memberId));
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
