<script setup>
import { buildDetailUrl } from '../fields.js';

defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  emptyText: { type: String, default: '暂无数据' }
});

function handle(row) {
  if (!row.complaintNo) return;
  window.open(buildDetailUrl(row.complaintNo, row.__queue), '_blank');
}
</script>

<template>
  <el-table
    :data="rows"
    border
    stripe
    height="620"
    style="width: 100%"
    :empty-text="emptyText"
  >
    <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />

    <el-table-column
      v-for="col in columns"
      :key="col.key"
      :prop="col.key"
      :label="col.label"
      :width="col.fixed ? col.width : undefined"
      :min-width="col.fixed ? undefined : col.width"
      :align="col.align"
      :fixed="col.fixed"
      sortable
      :sort-orders="['descending', 'ascending', null]"
      :show-overflow-tooltip="!!col.tooltip && !col.tag"
    >
      <template #default="{ row }">
        <el-tag v-if="col.tag && row[col.key]" size="small" type="warning">{{ row[col.key] }}</el-tag>
        <span v-else>{{ row[col.key] == null ? '' : row[col.key] }}</span>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="90" fixed="right" align="center">
      <template #default="{ row }">
        <el-button type="primary" link :disabled="!row.complaintNo" @click="handle(row)">处理</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
