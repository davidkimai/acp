const state = {
  session: null,
  cycles: [],
  selectedCycleId: null,
  participantCycleId: null,
  participantId: null,
  participantView: null,
  exportsByCycle: new Map(),
  auditByCycle: new Map(),
  metricsByCycle: new Map(),
  draftStarted: false,
  responseStarted: false,
};

const els = {
  connection: document.querySelector('#connection-state'),
  route: document.querySelector('#route-state'),
  toast: document.querySelector('#toast'),
  createCycleForm: document.querySelector('#create-cycle-form'),
  cycleList: document.querySelector('#cycle-list'),
  operatorDetail: document.querySelector('#operator-detail'),
  refreshCycles: document.querySelector('#refresh-cycles'),
  participantCycleSelect: document.querySelector('#participant-cycle-select'),
  participantSelect: document.querySelector('#participant-select'),
  loadParticipantView: document.querySelector('#load-participant-view'),
  participantDetail: document.querySelector('#participant-detail'),
  cycleCardTemplate: document.querySelector('#cycle-card-template'),
  digestItemTemplate: document.querySelector('#digest-item-template'),
  auditItemTemplate: document.querySelector('#audit-item-template'),
};

function showToast(message, tone = 'neutral') {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.dataset.tone = tone;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const payload = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.error || response.statusText;
    throw new Error(message);
  }
  return payload;
}

function parseParticipants(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, name] = line.split(',').map((part) => part.trim());
      return { id, name: name || id, role: 'participant' };
    });
}

function statusChip(value, accent = false) {
  const cls = value.includes('archived') ? 'status-chip--neutral' : value.includes('closed') ? 'status-chip--warn' : 'status-chip--ok';
  return `<span class="status-chip ${accent ? 'status-chip--accent' : cls}">${value}</span>`;
}

function setRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    els.route.textContent = 'operator';
    return;
  }
  els.route.textContent = hash;
  const parts = hash.split('/');
  if (parts[0] === 'operator') {
    state.selectedCycleId = parts[1] || state.selectedCycleId;
  }
  if (parts[0] === 'participant') {
    state.participantCycleId = parts[1] || state.participantCycleId;
    state.participantId = parts[2] || state.participantId;
  }
}

function cycleById(cycleId) {
  return state.cycles.find((cycle) => cycle.id === cycleId) || null;
}

async function bootstrap() {
  try {
    state.session = await api('/v1/session');
    els.connection.textContent = 'Connected';
    els.connection.className = 'status-chip status-chip--ok';
    setRoute();
    await loadCycles();
  } catch (error) {
    els.connection.textContent = 'Disconnected';
    els.connection.className = 'status-chip status-chip--warn';
    showToast(error.message, 'warn');
  }
}

async function loadCycles() {
  const payload = await api('/v1/cycles');
  state.cycles = payload.cycles || [];
  if (!state.selectedCycleId && state.cycles[0]) {
    state.selectedCycleId = state.cycles[0].id;
  }
  if (!state.participantCycleId && state.cycles[0]) {
    state.participantCycleId = state.cycles[0].id;
  }
  hydrateParticipantSelectors();
  renderCycleList();
  await renderOperatorDetail();
}

function hydrateParticipantSelectors() {
  els.participantCycleSelect.innerHTML = state.cycles
    .map((cycle) => `<option value="${cycle.id}" ${cycle.id === state.participantCycleId ? 'selected' : ''}>${cycle.title}</option>`)
    .join('');
  const cycle = cycleById(state.participantCycleId);
  const participants = cycle?.participants?.filter((participant) => participant.role === 'participant') || [];
  if (!participants.some((participant) => participant.id === state.participantId)) {
    state.participantId = participants[0]?.id || null;
  }
  els.participantSelect.innerHTML = participants
    .map((participant) => `<option value="${participant.id}" ${participant.id === state.participantId ? 'selected' : ''}>${participant.name}</option>`)
    .join('');
}

function renderCycleList() {
  els.cycleList.innerHTML = '';
  state.cycles.forEach((cycle) => {
    const node = els.cycleCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-role="title"]').textContent = cycle.title;
    node.querySelector('[data-role="meta"]').textContent = `${cycle.participants.filter((item) => item.role === 'participant').length} participants`;
    node.querySelector('[data-role="condition"]').outerHTML = statusChip(cycle.condition, true);
    node.querySelector('[data-role="status"]').outerHTML = statusChip(cycle.status);
    node.addEventListener('click', () => {
      state.selectedCycleId = cycle.id;
      window.location.hash = `#/operator/${cycle.id}`;
      renderOperatorDetail();
    });
    els.cycleList.append(node);
  });
}

async function transition(cycleId, action, path) {
  await api(path, { method: 'POST' });
  showToast(`${action} complete`, 'ok');
  await loadCycles();
  if (state.participantCycleId === cycleId && state.participantId) {
    await loadParticipantView();
  }
}

async function renderOperatorDetail() {
  const cycle = cycleById(state.selectedCycleId);
  if (!cycle) {
    els.operatorDetail.className = 'detail-card empty-state';
    els.operatorDetail.textContent = 'Select or create a cycle.';
    return;
  }

  const [auditPayload, metricsPayload, exportsPayload] = await Promise.all([
    api(`/v1/cycles/${cycle.id}/audit-events`).catch(() => ({ auditEvents: [] })),
    api(`/v1/cycles/${cycle.id}/metrics`).catch(() => ({ metrics: null })),
    api(`/v1/cycles/${cycle.id}/exports`).catch(() => ({ exports: [] })),
  ]);
  state.auditByCycle.set(cycle.id, auditPayload.auditEvents || []);
  state.metricsByCycle.set(cycle.id, metricsPayload.metrics || null);
  state.exportsByCycle.set(cycle.id, exportsPayload.exports || []);

  const actionButtons = [
    ['Open', `/v1/cycles/${cycle.id}/open`, cycle.status === 'draft'],
    ['Close submissions', `/v1/cycles/${cycle.id}/close-submissions`, cycle.status === 'submission_open'],
    ['Run routing', `/v1/cycles/${cycle.id}/routing`, cycle.condition === 'intervention' && cycle.status === 'submission_closed'],
    ['Release', `/v1/cycles/${cycle.id}/release`, (cycle.condition === 'intervention' && cycle.status === 'routing_completed') || (cycle.condition === 'baseline_thread' && cycle.status === 'submission_closed')],
    ['Close reflection', `/v1/cycles/${cycle.id}/close-reflection`, cycle.status === 'digests_released'],
    ['Archive', `/v1/cycles/${cycle.id}/archive`, cycle.status === 'reflection_closed'],
    ['Replay', `/v1/cycles/${cycle.id}/replay`, true],
  ];

  const metrics = state.metricsByCycle.get(cycle.id) || {};
  const auditRows = (state.auditByCycle.get(cycle.id) || [])
    .slice()
    .reverse()
    .map((event) => {
      const node = els.auditItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('[data-role="action"]').textContent = event.action;
      node.querySelector('[data-role="meta"]').textContent = `${event.createdAt} · ${event.actorType}:${event.actorId}`;
      return node.outerHTML;
    })
    .join('');

  els.operatorDetail.className = 'detail-card';
  els.operatorDetail.innerHTML = `
    <div class="detail-meta">
      <div>
        <p class="section-label">Selected cycle</p>
        <h3>${cycle.title}</h3>
      </div>
      ${statusChip(cycle.condition, true)}
      ${statusChip(cycle.status)}
    </div>
    <p>${cycle.prompt}</p>
    <div class="action-row">
      ${actionButtons
        .map(
          ([label, path, enabled]) =>
            `<button data-path="${path}" data-action-label="${label}" ${enabled ? '' : 'disabled'}>${label}</button>`,
        )
        .join('')}
      <button data-export="analysis" class="ghost-button">Export analysis</button>
      <button data-export="audit" class="ghost-button">Export audit</button>
      <button data-export="minimal" class="ghost-button">Export minimal</button>
    </div>
    <div class="metric-grid">
      ${[
        ['Exposure Gini', metrics.exposureConcentrationGini ?? '—'],
        ['Reply Gini', metrics.replyConcentrationGini ?? '—'],
        ['Coverage', metrics.averageContributorCoverage ?? '—'],
        ['Bridge rate', metrics.bridgeExposureRate ?? '—'],
        ['Explanation rate', metrics.explanationEngagementRate ?? '—'],
        ['Abandonment', metrics.abandonmentRate ?? '—'],
      ]
        .map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`)
        .join('')}
    </div>
    <div>
      <p class="section-label">Audit timeline</p>
      <ul class="audit-list">${auditRows || '<li class="empty-state">No audit events yet.</li>'}</ul>
    </div>
    <div>
      <p class="section-label">Exports</p>
      <div class="list">${(state.exportsByCycle.get(cycle.id) || [])
        .map((artifact) => `<div class="list-card"><strong>${artifact.mode}</strong><span>${artifact.createdAt}</span></div>`)
        .join('') || '<div class="empty-state">No exports generated yet.</div>'}</div>
    </div>
  `;

  els.operatorDetail.querySelectorAll('button[data-path]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await transition(cycle.id, button.dataset.actionLabel, button.dataset.path);
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
  });
  els.operatorDetail.querySelectorAll('button[data-export]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const mode = button.dataset.export;
        const payload = await api(`/v1/cycles/${cycle.id}/exports`, {
          method: 'POST',
          body: JSON.stringify({ mode }),
        });
        showToast(`${mode} export generated`, 'ok');
        const exports = state.exportsByCycle.get(cycle.id) || [];
        state.exportsByCycle.set(cycle.id, [...exports.filter((item) => item.mode !== mode), payload.export]);
        await renderOperatorDetail();
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
  });
}

async function emitParticipantEvent(eventType, metadata = {}, targetId = undefined) {
  if (!state.participantCycleId || !state.participantId) return;
  await api(`/v1/cycles/${state.participantCycleId}/participants/${state.participantId}/events`, {
    method: 'POST',
    body: JSON.stringify({ eventType, targetId, surface: 'participant_web', metadata }),
  });
}

async function loadParticipantView() {
  if (!state.participantCycleId || !state.participantId) {
    return;
  }
  const payload = await api(`/v1/cycles/${state.participantCycleId}/participants/${state.participantId}/view`);
  state.participantView = payload.view;
  window.location.hash = `#/participant/${state.participantCycleId}/${state.participantId}`;
  await emitParticipantEvent('prompt_viewed', { mode: payload.view.mode });
  if (payload.view.mode === 'digest' && payload.view.digest) {
    await emitParticipantEvent('digest_opened', { digestId: payload.view.digest.id, digestItemCount: payload.view.digest.items.length }, payload.view.digest.id);
  }
  if (payload.view.mode === 'thread' && payload.view.thread) {
    await emitParticipantEvent('thread_opened', { contributionCountVisible: payload.view.thread.length });
  }
  renderParticipantView();
}

function participantViewContributionForm(view) {
  return `
    <form id="contribution-form" class="stacked-form">
      <div>
        <p class="section-label">Prompt</p>
        <p>${view.cycle.prompt}</p>
      </div>
      <label>
        <span>Your contribution</span>
        <textarea name="body" rows="5" required>${view.contribution?.body || ''}</textarea>
      </label>
      <div class="field-grid">
        <label>
          <span>Confidence</span>
          <select name="confidenceLabel">
            <option value="">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          <span>Evidence</span>
          <input name="evidenceText" placeholder="Optional evidence or reference" />
        </label>
      </div>
      <button type="submit">Submit contribution</button>
    </form>
  `;
}

function participantViewWaiting(view) {
  return `
    <div class="detail-card">
      <p class="section-label">Waiting</p>
      <h3>${view.cycle.title}</h3>
      <p>${view.contribution ? 'Your contribution is stored.' : 'Submissions are closed.'}</p>
      <p>The cycle is waiting for routing or release.</p>
    </div>
  `;
}

function buildItemNode(item, mode) {
  const node = els.digestItemTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-role="author"]').textContent = item.authorParticipantId;
  node.querySelector('[data-role="reason"]').textContent = item.reason || `Position ${item.position + 1}`;
  node.querySelector('[data-role="bridge"]').outerHTML = item.bridgeFlag ? statusChip('bridge', true) : statusChip(mode, false);
  node.querySelector('[data-role="body"]').textContent = item.body;
  const explanation = node.querySelector('[data-role="explanation"]');
  explanation.textContent = item.explanation || 'No explanation available.';

  node.querySelector('[data-action="open-item"]').addEventListener('click', async () => {
    const eventType = mode === 'digest' ? 'digest_item_opened' : 'thread_item_opened';
    await emitParticipantEvent(eventType, { bridgeFlag: !!item.bridgeFlag, positionIndex: item.position || 0 }, item.contributionId);
    if (item.bridgeFlag) {
      await emitParticipantEvent('bridge_item_engaged', { engagementType: 'opened', digestId: state.participantView?.digest?.id || null }, item.contributionId);
    }
    showToast(`Opened ${item.contributionId}`);
  });

  node.querySelector('[data-action="toggle-explanation"]').addEventListener('click', async () => {
    explanation.hidden = !explanation.hidden;
    if (!explanation.hidden && mode === 'digest') {
      await emitParticipantEvent('routing_explanation_viewed', { explanationScope: 'item_level', bridgeFlag: !!item.bridgeFlag }, item.contributionId);
    }
  });

  node.querySelector('[data-action="reply"]').addEventListener('click', () => {
    const responseForm = document.querySelector('#response-form');
    responseForm.querySelector('[name="parentContributionId"]').value = item.contributionId;
    responseForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  return node;
}

function renderParticipantView() {
  const view = state.participantView;
  if (!view) {
    els.participantDetail.className = 'detail-card empty-state';
    els.participantDetail.textContent = 'Pick a cycle and participant to load the canonical participant view.';
    return;
  }

  els.participantDetail.className = 'detail-card';
  const intro = `
    <div class="detail-meta">
      <div>
        <p class="section-label">${view.participant.name}</p>
        <h3>${view.cycle.title}</h3>
      </div>
      ${statusChip(view.cycle.condition, true)}
      ${statusChip(view.cycle.status)}
    </div>
    <p>${view.cycle.prompt}</p>
  `;

  if (view.mode === 'submission') {
    els.participantDetail.innerHTML = `${intro}${participantViewContributionForm(view)}`;
    const form = document.querySelector('#contribution-form');
    const body = form.querySelector('[name="body"]');
    body.addEventListener('focus', async () => {
      if (!state.draftStarted) {
        state.draftStarted = true;
        await emitParticipantEvent('contribution_started', {});
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const formData = new FormData(form);
        await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/contribution`, {
          method: 'POST',
          body: JSON.stringify({
            body: formData.get('body'),
            confidenceLabel: formData.get('confidenceLabel') || undefined,
            evidenceText: formData.get('evidenceText') || undefined,
          }),
        });
        state.draftStarted = false;
        showToast('Contribution submitted', 'ok');
        await loadCycles();
        await loadParticipantView();
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
    form.addEventListener('reset', async () => {
      if (state.draftStarted) {
        await emitParticipantEvent('contribution_abandoned', { abandonReason: 'form_reset' });
        state.draftStarted = false;
      }
    });
    return;
  }

  if (view.mode === 'waiting') {
    els.participantDetail.innerHTML = `${intro}${participantViewWaiting(view)}`;
    return;
  }

  const itemContainer = document.createElement('div');
  itemContainer.className = 'stacked-form';
  const items = view.mode === 'digest'
    ? (view.digest?.items || []).map((item) => buildItemNode(item, 'digest'))
    : (view.thread || []).map((contribution, index) =>
        buildItemNode(
          {
            contributionId: contribution.id,
            authorParticipantId: contribution.participantId,
            body: contribution.body,
            reason: 'Chronological thread item',
            explanation: 'Baseline thread items do not have routing explanations.',
            bridgeFlag: false,
            score: 0,
            position: index,
          },
          'thread',
        ),
      );
  items.forEach((item) => itemContainer.append(item));

  els.participantDetail.innerHTML = `
    ${intro}
    ${view.mode === 'digest' ? `<div class="detail-card"><strong>${view.digest?.summary || ''}</strong></div>` : ''}
    <div id="participant-items"></div>
    <form id="response-form" class="response-form">
      <p class="section-label">Reflection response</p>
      <input type="hidden" name="parentContributionId" />
      <textarea name="body" rows="4" required placeholder="Respond to one contribution in the cycle."></textarea>
      <button type="submit">Submit response</button>
    </form>
    <form id="feedback-form" class="feedback-form">
      <p class="section-label">Feedback</p>
      <div class="field-grid">
        <label><span>Overload</span><input type="number" name="overload" min="1" max="5" value="3" /></label>
        <label><span>Usefulness</span><input type="number" name="usefulness" min="1" max="5" value="3" /></label>
        <label><span>Exchange quality</span><input type="number" name="exchangeQuality" min="1" max="5" value="3" /></label>
        <label><span>Explanation clarity</span><input type="number" name="explanationClarity" min="1" max="5" value="3" /></label>
        <label><span>Return willingness</span><input type="number" name="returnWillingness" min="1" max="5" value="3" /></label>
      </div>
      <button type="submit">Submit feedback</button>
    </form>
  `;
  document.querySelector('#participant-items').replaceWith(itemContainer);

  const responseForm = document.querySelector('#response-form');
  responseForm.querySelector('[name="body"]').addEventListener('focus', async () => {
    if (!state.responseStarted) {
      state.responseStarted = true;
      await emitParticipantEvent('response_started', {});
    }
  });
  responseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(responseForm);
      await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          parentContributionId: formData.get('parentContributionId'),
          body: formData.get('body'),
        }),
      });
      state.responseStarted = false;
      showToast('Response submitted', 'ok');
      await loadCycles();
      await loadParticipantView();
    } catch (error) {
      showToast(error.message, 'warn');
    }
  });

  const feedbackForm = document.querySelector('#feedback-form');
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(feedbackForm);
      await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          instrumentVersion: 'v1',
          answers: {
            overload: Number(formData.get('overload')),
            usefulness: Number(formData.get('usefulness')),
            exchangeQuality: Number(formData.get('exchangeQuality')),
            explanationClarity: Number(formData.get('explanationClarity')),
            returnWillingness: Number(formData.get('returnWillingness')),
          },
        }),
      });
      showToast('Feedback submitted', 'ok');
      await loadCycles();
      await loadParticipantView();
    } catch (error) {
      showToast(error.message, 'warn');
    }
  });
}

els.createCycleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(els.createCycleForm);
    await api('/v1/cycles', {
      method: 'POST',
      body: JSON.stringify({
        title: formData.get('title'),
        prompt: formData.get('prompt'),
        condition: formData.get('condition'),
        participants: parseParticipants(String(formData.get('participants') || '')),
        config: {
          maxDigestItems: Number(formData.get('maxDigestItems')),
          maxBridgeItems: Number(formData.get('maxBridgeItems')),
        },
      }),
    });
    els.createCycleForm.reset();
    showToast('Cycle created', 'ok');
    await loadCycles();
  } catch (error) {
    showToast(error.message, 'warn');
  }
});

els.refreshCycles.addEventListener('click', async () => {
  try {
    await loadCycles();
    if (state.participantCycleId && state.participantId) {
      await loadParticipantView();
    }
  } catch (error) {
    showToast(error.message, 'warn');
  }
});

els.participantCycleSelect.addEventListener('change', () => {
  state.participantCycleId = els.participantCycleSelect.value;
  hydrateParticipantSelectors();
});

els.participantSelect.addEventListener('change', () => {
  state.participantId = els.participantSelect.value;
});

els.loadParticipantView.addEventListener('click', async () => {
  try {
    await loadParticipantView();
  } catch (error) {
    showToast(error.message, 'warn');
  }
});

window.addEventListener('hashchange', () => {
  setRoute();
  renderOperatorDetail();
  renderParticipantView();
});

bootstrap();
