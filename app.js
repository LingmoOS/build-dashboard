let DATA = null;
let filter = 'all';
let query = '';

async function loadData() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
    document.getElementById('last-error').textContent = '';
    render();
  } catch (e) {
    document.getElementById('last-error').textContent = `Failed to load data: ${e.message}`;
  }
}

function buildState(repo) {
  const b = repo.build || {};
  if (!b.status || b.status === 'none') return { key: 'none', label: 'No build' };
  if (b.status === 'queued' || b.status === 'in_progress' || b.status === 'pending' || b.status === 'waiting' || b.status === 'requested') {
    return { key: 'running', label: 'Running' };
  }
  if (b.status === 'completed') {
    if (b.conclusion === 'success') return { key: 'success', label: 'Passed' };
    if (b.conclusion === 'failure') return { key: 'failure', label: 'Failed' };
    return { key: 'pending', label: b.conclusion || 'Done' };
  }
  return { key: 'pending', label: b.status || 'Unknown' };
}

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function render() {
  if (!DATA) return;
  const repos = DATA.repos || [];

  // stats
  let success = 0, failure = 0, running = 0, released = 0;
  for (const r of repos) {
    const s = buildState(r);
    if (s.key === 'success') success++;
    else if (s.key === 'failure') failure++;
    else if (s.key === 'running') running++;
    if (r.release && r.release.tag) released++;
  }
  document.getElementById('stat-total').textContent = repos.length;
  document.getElementById('stat-success').textContent = success;
  document.getElementById('stat-failure').textContent = failure;
  document.getElementById('stat-running').textContent = running;
  document.getElementById('stat-released').textContent = released;

  document.getElementById('generated-at').textContent =
    DATA.generated_at ? `Updated ${timeAgo(DATA.generated_at)}` : '';

  // filter
  const q = query.toLowerCase();
  const list = repos.filter(r => {
    const s = buildState(r);
    const matchQ = !q || r.name.toLowerCase().includes(q);
    if (!matchQ) return false;
    switch (filter) {
      case 'success': return s.key === 'success';
      case 'failure': return s.key === 'failure';
      case 'running': return s.key === 'running';
      case 'none': return s.key === 'none';
      case 'released': return !!(r.release && r.release.tag);
      default: return true;
    }
  });

  const ul = document.getElementById('repo-list');
  ul.innerHTML = '';
  for (const r of list) {
    const s = buildState(r);
    const rel = r.release || {};
    const li = document.createElement('li');
    li.className = 'repo-row';

    const nameCell = document.createElement('div');
    nameCell.className = 'repo-name';
    const a = document.createElement('a');
    a.href = `https://github.com/Matrinsoft/${r.name}`;
    a.target = '_blank';
    a.textContent = r.name;
    nameCell.appendChild(a);
    li.appendChild(nameCell);

    const buildCell = document.createElement('div');
    const badge = document.createElement('a');
    badge.className = `badge ${s.key}`;
    badge.target = '_blank';
    badge.href = (r.build && r.build.url) || `https://github.com/Matrinsoft/${r.name}/actions`;
    const dot = document.createElement('span');
    dot.className = 'dot';
    badge.appendChild(dot);
    badge.appendChild(document.createTextNode(s.label));
    buildCell.appendChild(badge);
    li.appendChild(buildCell);

    const relCell = document.createElement('div');
    relCell.className = rel.tag ? 'release' : 'release none';
    if (rel.tag) {
      const ra = document.createElement('a');
      ra.href = rel.url || `https://github.com/Matrinsoft/${r.name}/releases/latest`;
      ra.target = '_blank';
      ra.textContent = rel.tag;
      relCell.appendChild(ra);
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = timeAgo(rel.published_at);
      relCell.appendChild(time);
    } else {
      relCell.textContent = '—';
    }
    li.appendChild(relCell);

    ul.appendChild(li);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('refresh').addEventListener('click', loadData);
  document.getElementById('search').addEventListener('input', e => {
    query = e.target.value;
    render();
  });
  document.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });
  setInterval(loadData, 60 * 1000);
});
