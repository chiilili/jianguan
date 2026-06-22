# 监管事务综合处置平台

一套面向京东监管投诉处理的轻量工具，由两部分组成：浏览器插件负责从投诉处理页导出数据，Web 应用负责可视化展示并跳回原系统处理。

**在线体验：[https://jianguan.woaiwusaqi.cn/](https://jianguan.woaiwusaqi.cn/)**

## 项目结构

| 目录 | 作用 |
| --- | --- |
| [`extension/`](extension/) | Chrome 插件（Manifest V3），在投诉处理页一键拉取各队列投诉单并导出为本地 JSON |
| [`apps/`](apps/) | Vue 3 + Vite + Element Plus 的 Web 程序，导入导出文件可视化展示，点「处理」跳回原系统处理 |

## 使用流程

1. 在 Chrome 安装 `extension/`（开发者模式 → 加载已解压扩展）。
2. 打开 `http://jianguan.jd.com/complaint/handle`，登录后点插件图标，勾选要导出的队列（待处理、和解未落实、待责任方回复、工商驳回、金融物流反馈），导出为 JSON。
3. 打开 [https://jianguan.woaiwusaqi.cn/](https://jianguan.woaiwusaqi.cn/) ，右上角导入导出文件（支持 JSON / Excel / CSV）。
4. 表格中点「处理」按钮，自动新标签页打开对应投诉单详情页。

## 主要功能

- **多文件导入**：JSON / Excel / CSV，按投诉单号自动去重
- **本地持久化**：数据存浏览器 localStorage，刷新不丢失
- **字段自定义**：「字段设置」菜单按需显隐列，默认仅显示常用 5 列，配置自动保存
- **多维筛选**：按字段筛选 + 关键词搜索
- **每列排序**：表头点击切换降序 / 升序 / 取消
- **一键跳转**：表格中点「处理」按队列名拼接 URL，新标签页打开原系统详情页


