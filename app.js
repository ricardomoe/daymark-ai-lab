const STORAGE_KEY = 'todo-tasks';
const RESERVATION_STORAGE_KEY = 'potluck-reservations';
const priorityRank = { high: 0, medium: 1, low: 2 };
const elements = {
  taskForm: document.getElementById('taskForm'),
  taskList: document.getElementById('taskList'),
  editDialog: document.getElementById('editDialog'),
  editForm: document.getElementById('editForm'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDescription: document.getElementById('emptyDescription'),
  appStatus: document.getElementById('appStatus'),
  reservationForm: document.getElementById('reservationForm'),
  contributionRows: document.getElementById('contributionRows'),
  reservationList: document.getElementById('reservationList'),
  reservationEmpty: document.getElementById('reservationEmpty'),
  reservationEmptyTitle: document.getElementById('reservationEmptyTitle'),
  reservationEmptyDescription: document.getElementById('reservationEmptyDescription'),
  reservationStatus: document.getElementById('reservationStatus'),
};

let currentFilter = 'all';
let editedTaskId = null;
let tasks = loadTasks();
let reservations = loadReservations();

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];

    return stored.filter(task => task && typeof task === 'object' && typeof task.title === 'string')
      .map(task => ({
        id: String(task.id || createId()),
        title: task.title,
        description: typeof task.description === 'string' ? task.description : '',
        assignee: typeof task.assignee === 'string' ? task.assignee : '',
        deadline: typeof task.deadline === 'string' ? task.deadline : '',
        priority: Object.hasOwn(priorityRank, task.priority) ? task.priority : 'medium',
        done: task.done === true,
        createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    elements.appStatus.textContent = '';
  } catch {
    elements.appStatus.textContent = 'Browser storage is unavailable. Changes will not survive a refresh.';
  }
}

function loadReservations() {
  try {
    const stored = JSON.parse(localStorage.getItem(RESERVATION_STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];

    return stored.filter(reservation => reservation && typeof reservation === 'object' &&
      typeof reservation.name === 'string' && typeof reservation.eventId === 'string' &&
      Array.isArray(reservation.items))
      .map(reservation => ({
        id: String(reservation.id || createId()),
        name: reservation.name,
        eventId: reservation.eventId,
        createdAt: typeof reservation.createdAt === 'string' ? reservation.createdAt : new Date().toISOString(),
        items: reservation.items.filter(item => item && typeof item.name === 'string' &&
          Number.isFinite(Number(item.cost)) && Number(item.cost) >= 0)
          .map(item => ({ name: item.name, cost: Number(item.cost) }))
          .filter(item => item.name.trim()),
      }))
      .filter(reservation => reservation.name.trim() && reservation.eventId.trim() && reservation.items.length);
  } catch {
    return [];
  }
}

function saveReservations() {
  try {
    localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(reservations));
    elements.reservationStatus.textContent = '';
  } catch {
    elements.reservationStatus.textContent = 'Browser storage is unavailable. Reservations will not survive a refresh.';
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
}

function addContributionRow() {
  const row = document.createElement('div');
  row.className = 'contribution-row';
  row.innerHTML = `
    <label class="form-group">
      <span>Item</span>
      <input type="text" data-contribution-name maxlength="120" placeholder="e.g. Garden salad" required />
    </label>
    <label class="form-group">
      <span>Cost each (USD)</span>
      <input type="number" data-contribution-cost min="0" step="0.01" inputmode="decimal" placeholder="0.00" required />
    </label>
    <button class="remove-contribution" type="button" data-remove-contribution aria-label="Remove item">×</button>`;
  elements.contributionRows.append(row);
  updateContributionRows();
}

function updateContributionRows() {
  const rows = elements.contributionRows.querySelectorAll('.contribution-row');
  rows.forEach(row => {
    row.querySelector('[data-remove-contribution]').disabled = rows.length === 1;
  });
  updateContributionTotal();
}

function updateContributionTotal() {
  const total = Array.from(elements.contributionRows.querySelectorAll('[data-contribution-cost]'))
    .reduce((sum, input) => sum + (Number(input.value) || 0), 0);
  document.getElementById('contributionTotal').textContent = formatCurrency(total);
}

function renderReservation(reservation) {
  const id = escapeHtml(reservation.id);
  const items = reservation.items.map(item => `
    <li>${escapeHtml(item.name)} <strong>${formatCurrency(item.cost)}</strong></li>`).join('');
  const total = reservation.items.reduce((sum, item) => sum + item.cost, 0);

  return `
    <li class="reservation-item" data-reservation-id="${id}">
      <div>
        <h4>${escapeHtml(reservation.name)}</h4>
        <p class="reservation-event">Event ID · <strong>${escapeHtml(reservation.eventId)}</strong></p>
        <ul class="reservation-contributions">${items}</ul>
        <p class="reservation-total">Contribution total <strong>${formatCurrency(total)}</strong></p>
      </div>
      <button class="action-button action-delete" type="button" data-delete-reservation aria-label="Remove reservation for ${escapeHtml(reservation.name)}">Remove</button>
    </li>`;
}

function renderReservations() {
  const search = document.getElementById('eventSearch').value.trim().toLocaleLowerCase();
  const visibleReservations = reservations.filter(reservation => reservation.eventId.toLocaleLowerCase().includes(search));
  elements.reservationList.innerHTML = visibleReservations.map(renderReservation).join('');
  document.getElementById('reservationCount').textContent = `${visibleReservations.length} ${visibleReservations.length === 1 ? 'reservation' : 'reservations'}`;
  elements.reservationEmpty.hidden = visibleReservations.length > 0;

  if (!reservations.length) {
    elements.reservationEmptyTitle.textContent = 'No reservations yet';
    elements.reservationEmptyDescription.textContent = 'Book a spot above and add what you\'re bringing.';
  } else {
    elements.reservationEmptyTitle.textContent = 'No matching reservations';
    elements.reservationEmptyDescription.textContent = 'Check the event ID and try again.';
  }
}

function localDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function isDueToday(task) {
  return !task.done && Boolean(task.deadline) && task.deadline.slice(0, 10) === localDateKey();
}

function isOverdue(task) {
  return !task.done && Boolean(task.deadline) && new Date(task.deadline).getTime() < Date.now();
}

function formatDeadline(deadline) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'Invalid deadline';
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderTask(task) {
  const overdue = isOverdue(task);
  const safeId = escapeHtml(task.id);
  const priority = task.priority;
  const deadlineLabel = task.deadline
    ? `<span class="badge ${overdue ? 'badge-overdue' : 'badge-deadline'}">${overdue ? 'Overdue · ' : 'Due · '}${escapeHtml(formatDeadline(task.deadline))}</span>`
    : '';
  const assigneeLabel = task.assignee
    ? `<span class="badge">Assigned to ${escapeHtml(task.assignee)}</span>`
    : '';

  return `
    <li class="task-item ${task.done ? 'is-done' : ''}" data-task-id="${safeId}">
      <input class="task-check" type="checkbox" data-action="toggle" ${task.done ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.title)} ${task.done ? 'open' : 'complete'}" />
      <div class="task-main">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="badge badge-priority-${priority}">${priority[0].toUpperCase()}${priority.slice(1)} priority</span>
          ${assigneeLabel}
          ${deadlineLabel}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-button" type="button" data-action="edit">Edit</button>
        <button class="action-button action-delete" type="button" data-action="delete">Delete</button>
      </div>
    </li>`;
}

function renderTasks() {
  const openTasks = tasks.filter(task => !task.done);
  document.getElementById('openCount').textContent = openTasks.length;
  document.getElementById('todayCount').textContent = openTasks.filter(isDueToday).length;
  document.getElementById('overdueCount').textContent = openTasks.filter(isOverdue).length;
  document.getElementById('doneCount').textContent = tasks.length - openTasks.length;
  document.getElementById('todayLabel').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const search = document.getElementById('searchInput').value.trim().toLocaleLowerCase();
  const sortBy = document.getElementById('sortSelect').value;
  const visibleTasks = tasks.filter(task => {
    const searchable = `${task.title} ${task.assignee} ${task.description}`.toLocaleLowerCase();
    if (search && !searchable.includes(search)) return false;
    if (currentFilter === 'pending') return !task.done;
    if (currentFilter === 'done') return task.done;
    if (currentFilter === 'today') return isDueToday(task);
    if (currentFilter === 'overdue') return isOverdue(task);
    return true;
  });

  visibleTasks.sort((first, second) => {
    if (sortBy === 'newest') return new Date(second.createdAt) - new Date(first.createdAt);
    if (sortBy === 'priority') return priorityRank[first.priority] - priorityRank[second.priority];
    const firstDeadline = first.deadline ? new Date(first.deadline).getTime() : Infinity;
    const secondDeadline = second.deadline ? new Date(second.deadline).getTime() : Infinity;
    return firstDeadline - secondDeadline;
  });

  elements.taskList.innerHTML = visibleTasks.map(renderTask).join('');
  document.getElementById('resultCount').textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;
  elements.emptyState.hidden = visibleTasks.length > 0;
  if (!tasks.length) {
    elements.emptyTitle.textContent = 'Nothing on the list yet';
    elements.emptyDescription.textContent = 'Add a task above to get started.';
  } else {
    elements.emptyTitle.textContent = 'No matching tasks';
    elements.emptyDescription.textContent = 'Try a different filter or search term.';
  }
}

elements.taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(elements.taskForm);
  tasks.unshift({
    id: createId(),
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    assignee: formData.get('assignee').trim(),
    deadline: formData.get('deadline'),
    priority: formData.get('priority'),
    done: false,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
  elements.taskForm.reset();
  document.getElementById('taskPriority').value = 'medium';
  renderTasks();
  document.getElementById('taskTitle').focus();
});

document.querySelector('.filter-group').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  currentFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(filterButton => {
    const selected = filterButton === button;
    filterButton.classList.toggle('active', selected);
    filterButton.setAttribute('aria-pressed', String(selected));
  });
  renderTasks();
});

document.getElementById('searchInput').addEventListener('input', renderTasks);
document.getElementById('sortSelect').addEventListener('change', renderTasks);

elements.taskList.addEventListener('change', event => {
  if (!event.target.matches('[data-action="toggle"]')) return;
  const item = event.target.closest('[data-task-id]');
  const task = tasks.find(candidate => candidate.id === item.dataset.taskId);
  if (!task) return;
  task.done = event.target.checked;
  saveTasks();
  renderTasks();
});

elements.taskList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = button.closest('[data-task-id]');
  const task = tasks.find(candidate => candidate.id === item.dataset.taskId);
  if (!task) return;

  if (button.dataset.action === 'edit') {
    editedTaskId = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editAssignee').value = task.assignee;
    document.getElementById('editDeadline').value = task.deadline;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editDescription').value = task.description;
    elements.editDialog.showModal();
    document.getElementById('editTitle').focus();
  } else if (button.dataset.action === 'delete' && window.confirm(`Delete “${task.title}”?`)) {
    tasks = tasks.filter(candidate => candidate.id !== task.id);
    saveTasks();
    renderTasks();
  }
});

elements.editForm.addEventListener('submit', event => {
  event.preventDefault();
  const task = tasks.find(candidate => candidate.id === editedTaskId);
  if (!task) return;
  const formData = new FormData(elements.editForm);
  task.title = formData.get('title').trim();
  task.assignee = formData.get('assignee').trim();
  task.deadline = formData.get('deadline');
  task.priority = formData.get('priority');
  task.description = formData.get('description').trim();
  saveTasks();
  renderTasks();
  elements.editDialog.close();
});

document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => elements.editDialog.close());
});

document.getElementById('addContribution').addEventListener('click', addContributionRow);
elements.contributionRows.addEventListener('click', event => {
  if (!event.target.closest('[data-remove-contribution]')) return;
  event.target.closest('.contribution-row').remove();
  updateContributionRows();
});
elements.contributionRows.addEventListener('input', updateContributionTotal);

elements.reservationForm.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(elements.reservationForm);
  const items = Array.from(elements.contributionRows.querySelectorAll('.contribution-row')).map(row => ({
    name: row.querySelector('[data-contribution-name]').value.trim(),
    cost: Number(row.querySelector('[data-contribution-cost]').value),
  }));

  reservations.unshift({
    id: createId(),
    name: formData.get('guestName').trim(),
    eventId: formData.get('eventId').trim(),
    items,
    createdAt: new Date().toISOString(),
  });
  saveReservations();
  elements.reservationForm.reset();
  elements.contributionRows.innerHTML = '';
  addContributionRow();
  renderReservations();
  document.getElementById('guestName').focus();
});

document.getElementById('eventSearch').addEventListener('input', renderReservations);
elements.reservationList.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-reservation]');
  if (!button) return;
  const item = button.closest('[data-reservation-id]');
  const reservation = reservations.find(candidate => candidate.id === item.dataset.reservationId);
  if (!reservation || !window.confirm(`Remove ${reservation.name}'s reservation for event ${reservation.eventId}?`)) return;
  reservations = reservations.filter(candidate => candidate.id !== reservation.id);
  saveReservations();
  renderReservations();
});

elements.editDialog.addEventListener('close', () => {
  if (editedTaskId) {
    const editedItem = Array.from(elements.taskList.querySelectorAll('[data-task-id]'))
      .find(item => item.dataset.taskId === editedTaskId);
    (editedItem?.querySelector('[data-action="edit"]') || document.getElementById('taskTitle')).focus();
  }
  editedTaskId = null;
});

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) {
    tasks = loadTasks();
    renderTasks();
  }
  if (event.key === RESERVATION_STORAGE_KEY || event.key === null) {
    reservations = loadReservations();
    renderReservations();
  }
});

addContributionRow();
renderTasks();
renderReservations();
