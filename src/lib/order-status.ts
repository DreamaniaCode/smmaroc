const labels: Record<string, string> = { AWAITING_FUNDS: "Pending", DISPATCHING: "Processing", REVIEW_REQUIRED: "Pending", PENDING: "Pending", PROCESSING: "Processing", IN_PROGRESS: "In progress", COMPLETED: "Completed", PARTIAL: "Partial", CANCELED: "Canceled", FAILED: "Failed" };
export function apiOrderStatus(status: string): string { return labels[status] ?? "Unknown"; }
