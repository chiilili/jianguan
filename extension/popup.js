const statusEl = document.getElementById('status');
const pageSizeEl = document.getElementById('pageSize');
const useLabelsEl = document.getElementById('useLabels');
const queueListEl = document.getElementById('queueList');
const btn = document.getElementById('exportBtn');

const PAGE_RE = /^http:\/\/jianguan\.jd\.com\/complaint\/handle/;

// 渲染队列勾选项（默认全选）。
for (const q of COMPLAINT_QUEUES) {
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.value = q.id;
  cb.checked = true;
  label.appendChild(cb);
  label.appendChild(document.createTextNode(q.name));
  queueListEl.appendChild(label);
}

function allChecks() {
  return [...queueListEl.querySelectorAll('input[type="checkbox"]')];
}
function selectedIds() {
  return allChecks().filter((c) => c.checked).map((c) => c.value);
}
function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || '';
}

document.getElementById('selectAll').onclick = () => allChecks().forEach((c) => (c.checked = true));
document.getElementById('selectNone').onclick = () => allChecks().forEach((c) => (c.checked = false));

btn.addEventListener('click', async () => {
  const ids = selectedIds();
  if (ids.length === 0) {
    setStatus('请至少选择一个队列。', 'err');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !PAGE_RE.test(tab.url || '')) {
    setStatus('请先打开投诉处理页 jianguan.jd.com/complaint/handle 再使用本插件。', 'err');
    return;
  }

  btn.disabled = true;
  setStatus('正在拉取数据，请稍候…');

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: 'exportComplaints',
      queueIds: ids,
      pageSize: Number(pageSizeEl.value) || 100,
      useLabels: useLabelsEl.checked
    },
    (resp) => {
      btn.disabled = false;

      if (chrome.runtime.lastError) {
        setStatus('无法连接页面脚本，请刷新该页面后重试。', 'err');
        return;
      }
      if (!resp) {
        setStatus('未收到响应，请重试。', 'err');
        return;
      }

      const lines = (resp.results || []).map(
        (r) => `✓ ${r.name}：${r.count} 条（总计 ${r.totalCount}）`
      );
      (resp.errors || []).forEach((e) => lines.push(`✗ ${e.name}：${e.error}`));

      setStatus(lines.join('\n') || '无数据。', resp.ok ? 'ok' : 'err');
    }
  );
});
