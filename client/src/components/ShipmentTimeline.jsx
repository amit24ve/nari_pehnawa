import React from "react";
import {
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle2,
  Circle,
  XCircle,
  RotateCcw,
} from "lucide-react";

/**
 * Ordered lifecycle used to render the timeline. Any status not in this
 * list (e.g. "failed") is rendered as a standalone error state instead.
 */
const STEPS = [
  { key: "order_created", label: "Order Created", icon: PackageCheck },
  { key: "awb_assigned", label: "Courier Assigned", icon: Truck },
  { key: "pickup_scheduled", label: "Pickup Scheduled", icon: MapPin },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const TERMINAL_NEGATIVE = new Set(["cancelled", "rto_initiated", "rto_delivered", "failed"]);

function stepIndex(status) {
  return STEPS.findIndex((s) => s.key === status);
}

/**
 * ShipmentStatusTimeline — visual step tracker for a shipment's lifecycle.
 * Pass the `shipment_status` value stored on the order (see
 * app/schemas/shipping.py::ShipmentStatus).
 */
const ShipmentTimeline = ({ status = "new", compact = false }) => {
  if (TERMINAL_NEGATIVE.has(status)) {
    const isCancelled = status === "cancelled";
    const Icon = isCancelled ? XCircle : RotateCcw;
    const label = isCancelled
      ? "Shipment Cancelled"
      : status === "rto_delivered"
        ? "Returned to Origin"
        : "Return Initiated";
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }

  const currentIdx = status === "new" ? -1 : stepIndex(status);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          return (
            <span
              key={step.key}
              className={`w-2 h-2 rounded-full ${done ? "bg-[#d4af37]" : "bg-gray-200"}`}
              title={step.label}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon = done ? CheckCircle2 : Circle;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  done ? "text-[#d4af37]" : "text-gray-300"
                } ${isCurrent ? "animate-pulse" : ""}`}
                fill={done ? "currentColor" : "none"}
              />
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] ${done ? "bg-[#d4af37]" : "bg-gray-200"}`}
                />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-medium ${
                  done ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-[#d4af37] font-medium mt-0.5">
                  Current status
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShipmentTimeline;
