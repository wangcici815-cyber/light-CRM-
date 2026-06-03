// ──── 标签颜色 ────
export const tagColors: Record<string, string> = {
  "高意向": "bg-green-100 text-green-700",
  "意向一般": "bg-amber-100 text-amber-700",
  "已流失": "bg-red-100 text-red-700",
  "VIP客户": "bg-purple-100 text-purple-700",
  "新客户": "bg-blue-100 text-blue-700",
};

// ──── 跟进活动 ────
export const activityTypeLabels: Record<string, string> = {
  CALL: "电话", MEETING: "拜访", EMAIL: "邮件", WECHAT: "微信", OTHER: "其他",
};

export const activityTypeColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-700", MEETING: "bg-green-100 text-green-700",
  EMAIL: "bg-amber-100 text-amber-700", WECHAT: "bg-purple-100 text-purple-700", OTHER: "bg-gray-100 text-gray-700",
};

// ──── 报价单状态 ────
export const quotationStatusLabels: Record<string, string> = {
  DRAFT: "草稿", SENT: "已发送", ACCEPTED: "已接受", REJECTED: "已拒绝",
};

export const quotationStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
};

// ──── 合同状态 ────
export const contractStatusLabels: Record<string, string> = {
  DRAFT: "草稿", ACTIVE: "进行中", COMPLETED: "已完成", TERMINATED: "已终止",
};

export const contractStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700", TERMINATED: "bg-red-100 text-red-700",
};
