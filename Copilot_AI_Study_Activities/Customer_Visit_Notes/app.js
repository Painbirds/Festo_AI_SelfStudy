const STORAGE_KEY = 'fieldnote-customer-visits-v1';
const recordList = document.querySelector('#record-list');
const visitForm = document.querySelector('#visit-form');
const searchInput = document.querySelector('#search-input');
const statusInput = document.querySelector('#status-input');
const deleteButton = document.querySelector('#delete-button');
const saveStatus = document.querySelector('#save-status');

const fields = {
  company: document.querySelector('#company-input'),
  contact: document.querySelector('#contact-input'),
  date: document.querySelector('#date-input'),
  type: document.querySelector('#type-input'),
  status: statusInput,
  attendees: document.querySelector('#attendees-input'),
  summary: document.querySelector('#summary-input'),
  needs: document.querySelector('#needs-input'),
  nextStep: document.querySelector('#next-step-input'),
};

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const starterRecords = [
  {
    id: 'sample-1', company: '한빛테크', contact: '김민서 매니저', date: dateOffset(1), type: '대면 미팅', status: 'follow-up',
    attendees: '김민서, 박준호', summary: '신규 생산라인의 검사 자동화에 관심을 보임. 기존 설비와의 연동 범위 및 도입 일정을 논의함.',
    needs: '라인 정지 시간을 최소화하는 단계별 도입안과 비전 검사 샘플 결과 요청.', nextStep: '현장 레이아웃 검토 후 1차 제안서 전달하기',
  },
  {
    id: 'sample-2', company: '세림모터스', contact: '이준혁 팀장', date: dateOffset(4), type: '화상 미팅', status: 'follow-up',
    attendees: '이준혁, 최유나', summary: '품질 데이터 수집 현황을 확인하고, 불량 원인 분석 대시보드 데모를 진행함.',
    needs: '부서별 권한 설정과 기존 MES 데이터 연결 방식 확인 필요.', nextStep: '보안 체크리스트와 연동 사양서 공유하기',
  },
  {
    id: 'sample-3', company: '다온정밀', contact: '정하늘 대표', date: dateOffset(8), type: '현장 방문', status: 'done',
    attendees: '정하늘, 김민서', summary: '가공 공정과 검사 동선을 함께 점검함. 기존 제안의 적용 가능 구간을 고객과 합의함.',
    needs: '합의한 2개 공정에 대한 상세 견적 및 설치 일정 확정.', nextStep: '견적 검토 완료, 다음 주 발주 일정 확인',
  },
  {
    id: 'sample-4', company: '온유바이오', contact: '윤서진 책임', date: dateOffset(13), type: '전화 통화', status: 'done',
    attendees: '윤서진', summary: '지난달 납품한 장비의 사용 만족도를 확인하고 정기 점검 일정을 조율함.',
    needs: '분기별 예방 점검 일정 등록.', nextStep: '정기 점검 일정 안내 완료',
  },
];

function readRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [...starterRecords];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...starterRecords];
  } catch {
    return [...starterRecords];
  }
}

let records = readRecords();
let activeId = records[0]?.id ?? null;
let currentFilter = 'all';
let ascending = false;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatDate(value) {
  if (!value) return '날짜 미정';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(date);
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    saveStatus.textContent = '저장 공간을 사용할 수 없습니다. 브라우저 설정을 확인하세요.';
    return false;
  }
}

function getVisibleRecords() {
  const query = searchInput.value.trim().toLocaleLowerCase('ko-KR');
  return records
    .filter((record) => currentFilter === 'all' || record.status === currentFilter)
    .filter((record) => `${record.company} ${record.contact} ${record.summary}`.toLocaleLowerCase('ko-KR').includes(query))
    .sort((first, second) => (ascending ? 1 : -1) * first.date.localeCompare(second.date));
}

function renderList() {
  const visibleRecords = getVisibleRecords();
  document.querySelector('#visible-count').textContent = visibleRecords.length;
  document.querySelector('#total-count').textContent = records.length;
  document.querySelector('#follow-up-count').textContent = records.filter((record) => record.status === 'follow-up').length;

  if (visibleRecords.length === 0) {
    const hasRecords = records.length > 0;
    recordList.innerHTML = `<div class="empty-list"><strong>${hasRecords ? '검색 결과가 없습니다' : '아직 기록이 없습니다'}</strong>${hasRecords ? '검색어나 필터를 바꿔 보세요.' : '새 방문 기록을 추가해 시작하세요.'}</div>`;
    return;
  }

  recordList.innerHTML = visibleRecords.map((record) => `
    <button class="record-card${record.id === activeId ? ' selected' : ''}" type="button" data-record-id="${escapeHTML(record.id)}" aria-pressed="${record.id === activeId}">
      <span class="card-topline"><span class="card-company">${escapeHTML(record.company || '회사명 없음')}</span><span class="card-date">${formatDate(record.date)}</span></span>
      <span class="card-bottomline"><span class="card-contact">${escapeHTML(record.contact || record.type || '담당자 미입력')}</span><span class="status-pill${record.status === 'done' ? ' done' : ''}">${record.status === 'done' ? '완료' : '후속 조치'}</span></span>
    </button>`).join('');
}

function setForm(record) {
  for (const [key, input] of Object.entries(fields)) input.value = record?.[key] ?? '';
  if (!record) {
    fields.date.value = dateOffset(0);
    fields.type.value = '대면 미팅';
    fields.status.value = 'follow-up';
  }
  document.querySelector('#editor-mode').textContent = record ? '기록 상세' : '새 기록';
  document.querySelector('#form-kicker').textContent = record ? 'VISIT NOTE' : 'NEW VISIT';
  document.querySelector('#form-title').textContent = record ? `${record.company || '회사명 없음'} 방문 기록` : '방문 내용을 기록하세요';
  deleteButton.hidden = !record;
  saveStatus.textContent = record ? '수정 후 저장 버튼을 눌러 주세요.' : '새 기록을 작성하고 저장해 주세요.';
}

function selectRecord(id) {
  activeId = id;
  const selectedRecord = records.find((record) => record.id === id);
  setForm(selectedRecord);
  renderList();
}

recordList.addEventListener('click', (event) => {
  const card = event.target.closest('[data-record-id]');
  if (card) selectRecord(card.dataset.recordId);
});

visitForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!visitForm.reportValidity()) return;

  const record = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]));
  const isNew = !activeId || !records.some((item) => item.id === activeId);
  if (isNew) {
    record.id = globalThis.crypto?.randomUUID?.() ?? `visit-${Date.now()}`;
    records.unshift(record);
  } else {
    record.id = activeId;
    records = records.map((item) => item.id === activeId ? record : item);
  }

  if (!persistRecords()) return;
  activeId = record.id;
  setForm(record);
  saveStatus.textContent = '저장되었습니다.';
  renderList();
});

document.querySelector('#new-button').addEventListener('click', () => {
  activeId = null;
  visitForm.reset();
  setForm(null);
  renderList();
  fields.company.focus();
});

deleteButton.addEventListener('click', () => {
  if (!activeId) return;
  const record = records.find((item) => item.id === activeId);
  if (!record || !window.confirm(`'${record.company}' 방문 기록을 삭제할까요?`)) return;
  records = records.filter((item) => item.id !== activeId);
  if (!persistRecords()) return;
  activeId = records[0]?.id ?? null;
  setForm(records[0] ?? null);
  renderList();
});

searchInput.addEventListener('input', renderList);

document.querySelector('.filter-tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  currentFilter = button.dataset.filter;
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    const selected = tab === button;
    tab.classList.toggle('selected', selected);
    tab.setAttribute('aria-pressed', String(selected));
  });
  renderList();
});

document.querySelector('#sort-button').addEventListener('click', (event) => {
  ascending = !ascending;
  event.currentTarget.innerHTML = `${ascending ? '오래된순' : '최신순'} <span aria-hidden="true">↕</span>`;
  renderList();
});

document.querySelector('#export-button').addEventListener('click', () => {
  const headers = ['회사명', '담당자', '방문 날짜', '미팅 유형', '진행 상태', '참석자', '미팅 요약', '고객 요청 및 니즈', '다음 할 일'];
  const keys = ['company', 'contact', 'date', 'type', 'status', 'attendees', 'summary', 'needs', 'nextStep'];
  const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...records.map((record) => keys.map((key) => key === 'status' ? (record[key] === 'done' ? '완료' : '후속 조치 필요') : record[key]))]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `고객방문기록_${dateOffset(0)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderList();
setForm(records.find((record) => record.id === activeId) ?? null);