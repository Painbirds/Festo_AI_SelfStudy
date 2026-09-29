const STORAGE_KEY = 'customer-visit-note-app-v1';
const form = document.querySelector('#note-form');
const aliasInput = document.querySelector('#alias-input');
const dateInput = document.querySelector('#date-input');
const notesInput = document.querySelector('#notes-input');
const resultList = document.querySelector('#result-list');
const resultCount = document.querySelector('#result-count');
const formStatus = document.querySelector('#form-status');

let records = [];
let storageReady = true;

function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new TypeError('Stored notes must be an array.');
    return parsed.filter((record) => (
      record && typeof record.id === 'string'
      && typeof record.alias === 'string'
      && typeof record.date === 'string'
      && typeof record.notes === 'string'
    ));
  } catch {
    storageReady = false;
    formStatus.textContent = '저장된 기록을 읽을 수 없습니다. 기존 데이터는 변경하지 않았습니다.';
    return [];
  }
}

function saveRecords(nextRecords) {
  if (!storageReady) {
    formStatus.textContent = '브라우저 저장소를 사용할 수 없어 기록을 저장하지 못했습니다.';
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
    return true;
  } catch {
    formStatus.textContent = '저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.';
    return false;
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function createNoteCard(record) {
  const card = document.createElement('article');
  card.className = 'note-card';

  const top = document.createElement('div');
  top.className = 'note-card-top';
  const title = document.createElement('h3');
  title.textContent = record.alias;
  const date = document.createElement('time');
  date.className = 'note-date';
  date.dateTime = record.date;
  date.textContent = formatDate(record.date);
  top.append(title, date);

  const notes = document.createElement('p');
  notes.textContent = record.notes || '작성된 미팅 노트가 없습니다.';

  const meta = document.createElement('div');
  meta.className = 'note-meta';
  meta.textContent = `저장 ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(record.savedAt))}`;

  card.append(top, notes, meta);
  return card;
}

function renderRecords() {
  resultCount.textContent = String(records.length);
  resultList.replaceChildren();

  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const mark = document.createElement('span');
    mark.className = 'empty-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = 'N';
    const title = document.createElement('strong');
    title.textContent = '아직 저장된 기록이 없습니다';
    const description = document.createElement('p');
    description.textContent = '첫 방문 노트를 작성하면 이곳에 표시됩니다.';
    empty.append(mark, title, description);
    resultList.append(empty);
    return;
  }

  for (const record of records) resultList.append(createNoteCard(record));
}

document.querySelector('#clear-button').addEventListener('click', () => {
  form.reset();
  formStatus.textContent = '입력 내용을 지웠습니다. 저장된 기록은 유지됩니다.';
  aliasInput.focus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const record = {
    id: globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}`,
    alias: aliasInput.value.trim(),
    date: dateInput.value,
    notes: notesInput.value.trim(),
    savedAt: new Date().toISOString(),
  };

  if (!record.alias || !record.date) {
    formStatus.textContent = 'Customer Alias와 Visit Date를 입력해 주세요.';
    return;
  }

  const nextRecords = [record, ...records];
  if (!saveRecords(nextRecords)) return;

  records = nextRecords;
  renderRecords();
  form.reset();
  formStatus.textContent = '방문 기록을 저장했습니다.';
  aliasInput.focus();
});

records = loadRecords();
renderRecords();