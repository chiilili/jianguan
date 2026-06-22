// 投诉单字段 -> 中文列名映射。
// 顺序与投诉处理页表格列保持一致，导出「中文字段名」时按此顺序输出。
const COMPLAINT_FIELDS = [
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

const MAPPED_KEYS = new Set(COMPLAINT_FIELDS.map(([key]) => key));

// 把接口原始字段对象转成「中文字段名」对象。
// 已知字段按映射表顺序输出（缺失补 null）；不同队列特有但未在映射表中的字段，
// 用原始 key 原样追加在后面，避免丢数据。
function toLabeledRow(item) {
  const row = {};
  for (const [key, label] of COMPLAINT_FIELDS) {
    row[label] = item[key] === undefined ? null : item[key];
  }
  for (const key of Object.keys(item)) {
    if (!MAPPED_KEYS.has(key)) row[key] = item[key];
  }
  return row;
}
