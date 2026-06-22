# 投诉单数据导出助手（Chrome 插件）

在京东监管投诉处理页一键拉取各队列投诉单全部数据，分别导出为本地 JSON 文件。

## 一、需求

1. 作用域：仅在 `http://jianguan.jd.com/complaint/handle` 页面生效。
2. 多队列导出：每个队列对应一个接口与固定查询载荷（复用页面登录态、带 Cookie），弹窗里可勾选要导出的队列。

   | 队列 | 接口（`POST`，前缀 `http://jianguan.jd.com/api/complaint/query/`） | 固定载荷 |
   | --- | --- | --- |
   | 待处理 | `waitingHandle` | `{"sortOrder":"asc"}` |
   | 和解未落实 | `compromiseUnPracticable` | `{"complaintNo":"","buildDate":null}` |
   | 待责任方回复 | `waitingReply` | `{"complaintNo":"","buildDate":null}` |
   | 工商驳回 | `bizRejected` | `{"complaintNo":"","rejectDate":null}` |
   | 金融物流反馈 | `financeAndLogisticsFd` | `{"complaintNo":"","buildDate":null}` |

   > 实际请求体会自动注入 `pageNum`、`pageSize`，与上表载荷合并。
3. 自动翻页：根据返回的 `pageCount` 循环拉取，导出**全部**数据，而不仅是当前页。
4. 导出格式：**每个队列导出一个** `.json` 文件，文件名形如 `待处理_20260622-210000.json`。
5. 字段命名：默认使用中文字段名（如 `投诉单号`、`客户姓名`），可在弹窗中关闭改为接口原始英文字段；各队列特有、未在映射表中的字段会按原始 key 原样保留，不丢数据。
6. 扩展性：新增队列只需在 `queues.js` 数组里加一项，弹窗与导出逻辑自动适配。

## 二、导出文件结构

```json
{
  "exportTime": "2026/6/22 21:00:00",
  "source": "http://jianguan.jd.com/api/complaint/query/waitingHandle",
  "totalCount": 2,
  "count": 2,
  "list": [
    {
      "投诉单号": "1110122002026052229408787",
      "投诉单状态": "跟进人跟进",
      "订单号": "3498241001479074",
      "建单时间": "2026-05-24 13:41:15",
      "客户姓名": "林芳靖",
      "联系电话": "18718604759",
      "处理人": "donghao106",
      "订单属性": "自营",
      "退回驳回原因": "不符合退回场景",
      "投诉来源一级": "绿通投诉",
      "投诉来源二级": "国家局ODR"
    }
  ]
}
```

> 关闭「使用中文字段名」后，`list` 内为接口原始字段（`complaintNo`、`customerName` 等）。

## 三、字段映射

| 接口字段 | 中文列名 |
| --- | --- |
| complaintNo | 投诉单号 |
| statusName | 投诉单状态 |
| orderIds | 订单号 |
| remark | 备注 |
| buildDate | 建单时间 |
| customerName | 客户姓名 |
| contactTel | 联系电话 |
| responsibleReplyTime | 责任方回复时间 |
| followerCode | 处理人 |
| orderProperties | 订单属性 |
| bizRejectOpinion | 退回驳回原因 |
| classActionTypeName | 群诉名称 |
| regNo | 投诉登记号 |
| complaintSrc1Name | 投诉来源一级 |
| complaintSrc2Name | 投诉来源二级 |
| jdBackReason | 京东退回原因 |
| jdAuditRejectReason | 京东审核驳回原因 |

完整映射见 `fields.js`。

## 四、安装与使用

1. Chrome 打开 `chrome://extensions/`，右上角开启「开发者模式」。
2. 点击「加载已解压的扩展程序」，选择本 `extension` 目录。
3. 登录并打开 `http://jianguan.jd.com/complaint/handle`。
4. 点击工具栏插件图标 → 勾选要导出的队列 → 设置每页条数 / 是否中文字段名 → 点「导出所选队列」。
5. 浏览器对每个队列各自下载一个 `队列名_时间戳.json`。

> 一次导出多个队列时，浏览器可能首次弹出「是否允许下载多个文件」，点允许即可。

## 五、文件说明

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | MV3 配置：作用域、权限、内容脚本、弹窗 |
| `popup.html` / `popup.js` | 弹窗 UI、队列勾选与导出触发 |
| `content.js` | 页面内脚本：带登录态请求各队列接口、自动翻页、生成下载 |
| `queues.js` | 队列配置（接口地址 + 固定载荷），新增队列改这里 |
| `fields.js` | 字段中英文映射 |

## 六、常见问题

- **点导出提示「无法连接页面脚本」**：刷新投诉处理页后重试（内容脚本需随页面加载）。
- **导出 0 条 / 接口报错**：确认已登录、当前账号确有待处理投诉单。
- **字段缺失**：接口该字段返回 `null` 时导出为 `null`，属正常。
