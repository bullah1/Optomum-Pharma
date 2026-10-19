export const ORDER_STATUS_FLOW = [
  "pending",
  "processing",
  "payment",
  "confirmed",
  "packing",
  "packed",
  "shipped",
  "delivered",
] as const;

export type KnownOrderStatus = (typeof ORDER_STATUS_FLOW)[number] | "cancelled";

export const ORDER_STATUS_OPTIONS: KnownOrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

export const ORDER_STATUS_LABELS: Record<KnownOrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  payment: "Payment",
  confirmed: "Confirmed",
  packing: "Packing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_SET = new Set<KnownOrderStatus>(ORDER_STATUS_OPTIONS);

const getOrderStatusPriority = (status: KnownOrderStatus) => {
  if (status === "cancelled") return Number.MAX_SAFE_INTEGER;
  return ORDER_STATUS_FLOW.indexOf(status);
};

export const isKnownOrderStatus = (status?: string | null): status is KnownOrderStatus => {
  if (!status) return false;
  return ORDER_STATUS_SET.has(status as KnownOrderStatus);
};

export const getOrderStatusLabel = (status?: string | null) => {
  const resolvedStatus = isKnownOrderStatus(status) ? status : "pending";
  return ORDER_STATUS_LABELS[resolvedStatus];
};

export const resolveDisplayOrderStatus = (
  status?: string | null,
  trackingStatus?: string | null,
): KnownOrderStatus => {
  if (status === "cancelled" || trackingStatus === "cancelled") {
    return "cancelled";
  }

  const normalizedStatus = isKnownOrderStatus(status) ? status : null;
  const normalizedTracking = isKnownOrderStatus(trackingStatus) ? trackingStatus : null;

  if (!normalizedStatus && !normalizedTracking) return "pending";
  if (!normalizedTracking) return normalizedStatus ?? "pending";
  if (!normalizedStatus) return normalizedTracking;

  return getOrderStatusPriority(normalizedTracking) >= getOrderStatusPriority(normalizedStatus)
    ? normalizedTracking
    : normalizedStatus;
};