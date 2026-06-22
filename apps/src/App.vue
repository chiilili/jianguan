<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import { normalizeRow, COLUMNS } from './fields.js';
import ComplaintTable from './components/ComplaintTable.vue';

const STORAGE_KEY = 'jianguan_complaints_v1';
const COLS_KEY = 'jianguan_visible_columns_v1';
// 默认显示列（首次打开 / 重置时）。必须在 loadVisibleKeys() 调用前声明，避免 TDZ。
const DEFAULT_VISIBLE_KEYS = ['complaintNo', 'orderIds', 'remark', 'buildDate', 'contactTel'];

// 扁平、按投诉单号去重的行数组（每行含归一化字段 + __queue）。
const rows = ref(loadRows());
const searchField = ref(''); // '' = 全部字段
const keyword = ref('');
const fileInput = ref(null);

// 搜索字段下拉：全部字段 + 队列 + 所有数据列。
const searchFieldOptions = [
  { value: '', label: '全部字段' },
  { value: '__queue', label: '队列' },
  ...COLUMNS.map((c) => ({ value: c.key, label: c.label }))
];

// 字段显隐：保存可见列的 key 列表，持久化。
const visibleKeys = ref(loadVisibleKeys());
const visibleColumns = computed(() => COLUMNS.filter((c) => visibleKeys.value.includes(c.key)));

function loadVisibleKeys() {
  try {
    const arr = JSON.parse(localStorage.getItem(COLS_KEY) || 'null');
    if (Array.isArray(arr) && arr.length) {
      return COLUMNS.map((c) => c.key).filter((k) => arr.includes(k));
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_VISIBLE_KEYS;
}

watch(
  visibleKeys,
  (v) => localStorage.setItem(COLS_KEY, JSON.stringify(v)),
  { deep: true }
);

const allColumnsSelected = computed(() => visibleKeys.value.length === COLUMNS.length);

// 全选 / 反全选切换：已全选则清空，否则全选。
function toggleAllColumns() {
  visibleKeys.value = allColumnsSelected.value ? [] : COLUMNS.map((c) => c.key);
}
function resetColumns() {
  visibleKeys.value = [...DEFAULT_VISIBLE_KEYS];
}

function loadRows() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRows() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
}

function triggerPick() {
  fileInput.value && fileInput.value.click();
}

// 把单个文件解析成 { list, queue }。支持 JSON / Excel(.xlsx/.xls) / CSV。
async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    const json = JSON.parse(await file.text());
    const list = Array.isArray(json) ? json : json.list || [];
    return { list, queue: (json && json.queue) || null };
  }
  // Excel / CSV：raw:false 取格式化文本，避免 25 位投诉单号被当数字丢精度。
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const list = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
  return { list, queue: null };
}

// 选择一个或多个文件后立即导入，按投诉单号去重。
async function onFiles(e) {
  const fileList = [...(e.target.files || [])];
  if (!fileList.length) return;

  const seen = new Set(rows.value.map((r) => r.complaintNo));
  let added = 0;
  let dup = 0;
  let badFiles = 0;

  for (const file of fileList) {
    try {
      const { list, queue: fileQueue } = await parseFile(file);
      for (const r of list) {
        const n = normalizeRow(r);
        // 队列优先级：JSON 顶层 queue > 行内「队列/queue」列 > 默认待处理
        n.__queue = fileQueue || r['队列'] || r['queue'] || '待处理';
        if (!n.complaintNo) continue;
        if (seen.has(n.complaintNo)) {
          dup += 1;
          continue;
        }
        seen.add(n.complaintNo);
        rows.value.push(n);
        added += 1;
      }
    } catch (err) {
      badFiles += 1;
      ElMessage.error(`${file.name} 解析失败：${err.message}`);
    }
  }

  saveRows();
  e.target.value = ''; // 重置，允许再次选择同一文件
  ElMessage.success(
    `导入完成：新增 ${added} 条，按投诉单号去重跳过 ${dup} 条` +
      (badFiles ? `，失败 ${badFiles} 个文件` : '')
  );
}

function clearAll() {
  rows.value = [];
  searchField.value = '';
  keyword.value = '';
  saveRows();
  ElMessage.success('已清空全部记录');
}

// 按所选字段搜索；选「全部字段」时在队列 + 所有数据列中匹配。
const filteredRows = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return rows.value;
  const field = searchField.value;

  return rows.value.filter((r) => {
    if (field) {
      const v = r[field];
      return v != null && String(v).includes(kw);
    }
    if (r.__queue && String(r.__queue).includes(kw)) return true;
    return COLUMNS.some((c) => {
      const v = r[c.key];
      return v != null && String(v).includes(kw);
    });
  });
});

const tableEmptyText = computed(() =>
  rows.value.length ? '查询不到数据' : '暂无数据，请先导入文件（JSON / Excel / CSV）'
);
</script>

<template>
  <div class="app">
    <header class="gov-header">
      <div class="gov-header-inner">
        <div class="emblem">JD</div>
        <div class="titles">
          <h1>监管事务综合处置平台</h1>
          <span class="en">Integrated Regulatory Affairs Handling Platform</span>
        </div>
        <div class="actions">
          <input
            ref="fileInput"
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            multiple
            style="display: none"
            @change="onFiles"
          />
          <el-button @click="triggerPick">导入文件</el-button>
          <el-button type="danger" plain @click="clearAll">清空</el-button>
        </div>
      </div>
    </header>

    <div class="page">
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">数据主视图</span>
          <span class="panel-stat">共 {{ rows.length }} 条 · 当前 {{ filteredRows.length }} 条</span>
        </div>

        <div class="toolbar">
          <el-select v-model="searchField" style="width: 160px">
            <el-option
              v-for="opt in searchFieldOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="keyword"
            placeholder="筛选：输入关键字"
            clearable
            style="width: 360px"
          />

          <el-popover placement="bottom-end" :width="280" trigger="click">
            <template #reference>
              <el-button class="cols-btn">字段设置（{{ visibleColumns.length }}/{{ COLUMNS.length }}）</el-button>
            </template>
            <div class="cols-menu">
              <div class="cols-menu-head">
                <span>显示字段</span>
                <span>
                  <el-link type="primary" :underline="false" @click="toggleAllColumns">
                    {{ allColumnsSelected ? '取消全选' : '全选' }}
                  </el-link>
                  <el-link type="primary" :underline="false" @click="resetColumns">重置</el-link>
                </span>
              </div>
              <el-checkbox-group v-model="visibleKeys" class="cols-list">
                <el-checkbox v-for="c in COLUMNS" :key="c.key" :value="c.key">
                  {{ c.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-popover>
        </div>

        <ComplaintTable :rows="filteredRows" :columns="visibleColumns" :empty-text="tableEmptyText" />
      </div>
    </div>

    <footer class="gov-footer">
      <a href="https://github.com/chiilili" target="_blank" rel="noopener">2026 © 董昊. All rights reserved.</a>
      <span class="sep">|</span>
      <a href="http://status.woaiwusaqi.cn/" target="_blank" rel="noopener">服务状态</a>
      <span class="sep">|</span>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">苏ICP备2025224440号</a>
    </footer>
  </div>
</template>

<style>
/* 政务红主题：覆盖 Element Plus 主色 */
:root {
  --el-color-primary: #b01e23;
  --el-color-primary-light-3: #c24c50;
  --el-color-primary-light-5: #d07a7d;
  --el-color-primary-light-7: #e3aaac;
  --el-color-primary-light-8: #edc6c7;
  --el-color-primary-light-9: #f7e6e7;
  --el-color-primary-dark-2: #8d181c;
}

body {
  margin: 0;
  background: #eef1f5;
  font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif;
  color: #1f2329;
}

/* 顶部党政红横幅 + 金色分隔线 */
.gov-header {
  background: linear-gradient(180deg, #b01e23 0%, #8d161b 100%);
  border-bottom: 3px solid #d9b36a;
  color: #fff;
}
.gov-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}
.emblem {
  width: 44px;
  height: 44px;
  flex: none;
  border: 2px solid #f0d9a8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0d9a8;
  font-size: 22px;
}
.titles h1 {
  margin: 0;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 3px;
}
.titles .en {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  letter-spacing: 1px;
  opacity: 0.8;
}
.actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.page { max-width: 1280px; margin: 0 auto; padding: 22px 20px 48px; }

/* 白卡片主视图 */
.panel {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-top: 3px solid #b01e23;
  border-radius: 6px;
  padding: 16px 18px 18px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.panel-title {
  position: relative;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.panel-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 4px;
  background: #b01e23;
  border-radius: 2px;
}
.panel-stat { font-size: 12px; color: #86909c; }
.toolbar { display: flex; gap: 12px; margin-bottom: 14px; }
.cols-btn { margin-left: auto; }

.cols-menu-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eef0f3;
  font-size: 13px;
  font-weight: 600;
}
.cols-menu-head .el-link { margin-left: 12px; font-weight: 400; }
.cols-list { display: flex; flex-direction: column; gap: 2px; max-height: 320px; overflow: auto; }

/* 页脚 */
.gov-footer {
  text-align: center;
  padding: 18px 20px 28px;
  color: #86909c;
  font-size: 12px;
}
.gov-footer a { color: #8d161b; text-decoration: none; }
.gov-footer a:hover { text-decoration: underline; }
.gov-footer .sep { margin: 0 8px; color: #c9cdd4; }

/* 表格政务风：表头浅红灰底 */
.el-table th.el-table__cell {
  background: #f6eeee !important;
  color: #5a1f21;
  font-weight: 600;
}
/* 表头不换行，保证「文字 + 排序箭头」始终在同一行，排版一致 */
.el-table th.el-table__cell .cell {
  white-space: nowrap;
}
</style>
