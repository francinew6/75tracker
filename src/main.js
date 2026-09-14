const {
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
  getTeamDay
} = window.trackerState;

const avatarCatalog = window.avatarCatalog || [];
const backgroundCatalog = window.backgroundCatalog || {};

const memberCards = document.getElementById("memberCards");
const taskBoard = document.getElementById("taskBoard");
const teamCounter = document.getElementById("teamCounter");
const addMemberForm = document.getElementById("addMemberForm");
const nameField = document.getElementById("newMemberName");
const avatarField = document.getElementById("newMemberAvatar");
const caitlynButton = document.getElementById("caitlynButton");
const confettiZone = document.getElementById("confettiZone");

let state = createDefaultState();

void init();

async function init() {
  applyBackgroundImage();
  renderAvatarOptions();
  state = await fetchState();
  render();
  wireExtras();
}

function applyBackgroundImage() {
  if (backgroundCatalog.field) {
    document.body.style.setProperty("--field-image", `url('${backgroundCatalog.field}')`);
  }
}

function renderAvatarOptions() {
  const options = avatarCatalog.map((avatar) => `<option value="${avatar.url}">${escapeHtml(avatar.label)}</option>`).join("");
  avatarField.innerHTML = options;
}

function wireExtras() {
  addMemberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = addMember(state, nameField.value, avatarField.value);
    if (next !== state) {
      void saveAndRender(next);
      nameField.value = "";
      avatarField.selectedIndex = 0;
    }
  });

  caitlynButton.addEventListener("click", () => {
    showConfetti();
  });
}

async function fetchState() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) {
      return createDefaultState();
    }
    return normalizeState(await response.json());
  } catch {
    return createDefaultState();
  }
}

async function saveAndRender(nextState) {
  state = normalizeState(nextState);
  render();

  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });

    if (response.ok) {
      state = normalizeState(await response.json());
      render();
    }
  } catch {
  }
}

function render() {
  teamCounter.textContent = `Team shared day: ${getTeamDay(state)}/${MAX_DAYS} ✨ (rollover at ${ROLLOVER_HOUR}:00)`;
  renderMemberCards();
  renderTaskBoard();
}

function renderMemberCards() {
  memberCards.innerHTML = "";

  state.members.forEach((member) => {
    const card = document.createElement("article");
    card.className = "member-card";
    const completeForToday = allTasksDoneForMember(state, member.id);

    const avatarOptions = avatarCatalog
      .map((avatar) => `<option value="${avatar.url}" ${member.avatar === avatar.url ? "selected" : ""}>${escapeHtml(avatar.label)}</option>`)
      .join("");

    card.innerHTML = `
      <div class="member-head">
        <img class="avatar" src="${member.avatar}" alt="${escapeHtml(member.name)} avatar" />
        <input class="name-input" data-action="rename" data-member="${member.id}" value="${escapeHtml(member.name)}" aria-label="Name for ${escapeHtml(member.name)}" />
      </div>
      <select class="avatar-select" data-action="avatar" data-member="${member.id}" aria-label="Avatar for ${escapeHtml(member.name)}">${avatarOptions}</select>
      <p class="counter">Day ${member.day}/${MAX_DAYS}</p>
      <p class="status-note ${completeForToday ? "done" : "todo"}">${completeForToday ? "Ready for 4am rollover ✅" : "Tasks in progress ✨"}</p>
      <div class="actions">
        <button data-action="reset" data-member="${member.id}">Restart from 0</button>
      </div>
    `;

    memberCards.appendChild(card);
  });

  memberCards.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", handleAction);
  });

  memberCards.querySelectorAll("input[data-action='rename']").forEach((input) => {
    input.addEventListener("change", (event) => {
      void saveAndRender(setMemberName(state, event.target.dataset.member, event.target.value));
    });
  });

  memberCards.querySelectorAll("select[data-action='avatar']").forEach((select) => {
    select.addEventListener("change", (event) => {
      void saveAndRender(setMemberAvatar(state, event.target.dataset.member, event.target.value));
    });
  });
}

function renderTaskBoard() {
  const headers = state.members.map((member) => `<th scope="col">${escapeHtml(member.name)}</th>`).join("");

  const rows = state.tasks
    .map((task) => {
      const cells = state.members
        .map((member) => {
          const checked = isTaskDone(state, member.id, task.id);
          return `
            <td class="status-cell">
              <label>
                <input type="checkbox" data-member="${member.id}" data-task="${task.id}" ${checked ? "checked" : ""} />
                <span class="status-label ${checked ? "done" : ""}">${checked ? "Done" : "Todo"}</span>
              </label>
            </td>
          `;
        })
        .join("");

      return `<tr><th scope="row">${escapeHtml(task.name)}</th>${cells}</tr>`;
    })
    .join("");

  taskBoard.innerHTML = `<thead><tr><th scope="col">Task</th>${headers}</tr></thead><tbody>${rows}</tbody>`;

  taskBoard.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      void saveAndRender(setTaskCompletion(state, event.target.dataset.member, event.target.dataset.task, event.target.checked));
    });
  });
}

function handleAction(event) {
  if (event.target.dataset.action === "reset") {
    void saveAndRender(resetMember(state, event.target.dataset.member));
  }
}

function showConfetti() {
  confettiZone.innerHTML = "";
  for (let index = 0; index < 20; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.textContent = ["✨", "🎉", "🌸", "💫"][index % 4];
    piece.style.left = `${Math.floor(Math.random() * 96)}%`;
    piece.style.animationDelay = `${index * 30}ms`;
    confettiZone.appendChild(piece);
  }

  setTimeout(() => {
    confettiZone.innerHTML = "";
  }, 2200);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
