// 与插件导出保持一致的字段映射（英文 key <-> 中文列名）。
export const FIELDS = [
  ['complaintNo', '投诉单号'],
  ['statusName', '投诉单状态'],
  ['orderIds', '订单号'],
  ['remark', '备注'],
  ['buildDate', '建单时间'],
  ['customerName', '客户姓名'],
  ['contactTel', '联系电话'],
  ['responsibleReplyTime', '责任方回复时间'],
  ['followerCode', '处理人'],
  ['orderProperties', '订单属性'],
  ['bizRejectOpinion', '退回驳回原因'],
  ['classActionTypeName', '群诉名称'],
  ['regNo', '投诉登记号'],
  ['complaintSrc1Name', '投诉来源一级'],
  ['complaintSrc2Name', '投诉来源二级'],
  ['jdBackReason', '京东退回原因'],
  ['jdAuditRejectReason', '京东审核驳回原因'],
  ['bizId', '业务ID'],
  ['status', '状态码']
];

// 把一行（可能是中文字段名导出，也可能是英文原始字段）统一成英文 key。
export function normalizeRow(row) {
  const out = {};
  for (const [key, label] of FIELDS) {
    if (row[key] !== undefined && row[key] !== null) out[key] = row[key];
    else if (row[label] !== undefined) out[key] = row[label];
    else out[key] = null;
  }
  return out;
}

// 可在「字段设置」菜单中显隐的数据列（不含固定的「序号」「操作」列）。
export const COLUMNS = [
  { key: 'complaintNo', label: '投诉单号', width: 200, tooltip: true, fixed: 'left' },
  { key: 'statusName', label: '投诉单状态', width: 110, align: 'center', tag: true },
  { key: 'orderIds', label: '订单号', width: 160, tooltip: true },
  { key: 'remark', label: '备注', width: 90, tooltip: true },
  { key: 'buildDate', label: '建单时间', width: 160 },
  { key: 'customerName', label: '客户姓名', width: 100 },
  { key: 'contactTel', label: '联系电话', width: 130 },
  { key: 'responsibleReplyTime', label: '责任方回复时间', width: 160 },
  { key: 'followerCode', label: '处理人', width: 115 },
  { key: 'orderProperties', label: '订单属性', width: 90, align: 'center' },
  { key: 'bizRejectOpinion', label: '退回驳回原因', width: 160, tooltip: true },
  { key: 'classActionTypeName', label: '群诉名称', width: 120, tooltip: true },
  { key: 'regNo', label: '投诉登记号', width: 130, tooltip: true },
  { key: 'complaintSrc1Name', label: '投诉来源一级', width: 130 },
  { key: 'complaintSrc2Name', label: '投诉来源二级', width: 130 },
  { key: 'jdBackReason', label: '京东退回原因', width: 150, tooltip: true }
];

// 按投诉单号 + 队列名拼出处理详情页 URL。
// 例：complaintHandleDetail/1110122002026052229408787?tab=%E5%BE%85%E5%A4%84%E7%90%86&showCallerBtn=1
export function buildDetailUrl(complaintNo, queueName) {
  const tab = encodeURIComponent(queueName || '待处理');
  return `http://jianguan.jd.com/complaint/complaintHandleDetail/${complaintNo}?tab=${tab}&showCallerBtn=1`;
}
