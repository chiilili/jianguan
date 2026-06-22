// 运行在 http://jianguan.jd.com/complaint/handle 页面上。
// 复用页面登录态（credentials:'include'）调用各队列接口，自动翻页拉取全部数据，
// 再在页面内生成 JSON 文件触发下载。队列配置见 queues.js。

// 自动翻页拉取某个队列的全部数据。
async function fetchAllOfQueue(queue, pageSize) {
  const all = [];
  let pageNum = 1;
  let pageCount = 1;
  let totalCount = 0;

  do {
    const body = Object.assign({ pageNum, pageSize }, queue.payload);
    const res = await fetch(queue.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const json = await res.json();
    if (!json || !json.success) {
      throw new Error((json && json.msg) || '接口返回 success=false');
    }

    const data = json.data || {};
    (data.list || []).forEach((item) => all.push(item));
    pageCount = data.pageCount || 1;
    totalCount = data.totalCount || all.length;
    pageNum += 1;
  } while (pageNum <= pageCount);

  return { list: all, totalCount };
}

// 在页面内生成并下载 JSON 文件（无需 downloads 权限）。
function downloadJson(filename, dataObj) {
  const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 导出单个队列为一个 JSON 文件，返回结果统计。
async function exportQueue(queue, pageSize, useLabels) {
  const { list, totalCount } = await fetchAllOfQueue(queue, pageSize);
  const rows = useLabels ? list.map(toLabeledRow) : list;
  downloadJson(`${queue.name}_${timestamp()}.json`, {
    queue: queue.name,
    exportTime: new Date().toLocaleString('zh-CN'),
    source: queue.api,
    totalCount,
    count: rows.length,
    list: rows
  });
  return { id: queue.id, name: queue.name, count: rows.length, totalCount };
}

// 接收 popup 的导出指令，依次导出所选队列。
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== 'exportComplaints') return;

  (async () => {
    const pageSize = msg.pageSize || 100;
    const useLabels = !!msg.useLabels;
    const queueIds = Array.isArray(msg.queueIds) ? msg.queueIds : [];

    const results = [];
    const errors = [];

    for (const id of queueIds) {
      const queue = getQueue(id);
      if (!queue) continue;
      try {
        results.push(await exportQueue(queue, pageSize, useLabels));
        await sleep(400); // 多文件下载之间留间隔，避免浏览器拦截
      } catch (e) {
        errors.push({ name: queue.name, error: String((e && e.message) || e) });
      }
    }

    sendResponse({ ok: errors.length === 0, results, errors });
  })();

  return true; // 异步 sendResponse
});
