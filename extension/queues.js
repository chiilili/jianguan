// 投诉单各队列(标签页)配置。
// 新增一个导出队列时，只需在此数组里加一项即可。
// payload 为该队列固定的查询参数（不含 pageNum/pageSize，运行时自动注入）。
const API_BASE = 'http://jianguan.jd.com/api/complaint/query/';

const COMPLAINT_QUEUES = [
  {
    id: 'waitingHandle',
    name: '待处理',
    api: API_BASE + 'waitingHandle',
    payload: { sortOrder: 'asc' }
  },
  {
    id: 'compromiseUnPracticable',
    name: '和解未落实',
    api: API_BASE + 'compromiseUnPracticable',
    payload: { complaintNo: '', buildDate: null }
  },
  {
    id: 'waitingReply',
    name: '待责任方回复',
    api: API_BASE + 'waitingReply',
    payload: { complaintNo: '', buildDate: null }
  },
  {
    id: 'bizRejected',
    name: '工商驳回',
    api: API_BASE + 'bizRejected',
    payload: { complaintNo: '', rejectDate: null }
  },
  {
    id: 'financeAndLogisticsFd',
    name: '金融物流反馈',
    api: API_BASE + 'financeAndLogisticsFd',
    payload: { complaintNo: '', buildDate: null }
  }
];

function getQueue(id) {
  return COMPLAINT_QUEUES.find((q) => q.id === id);
}
