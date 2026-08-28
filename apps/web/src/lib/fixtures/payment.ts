import type { PaymentHandle } from "../types";

/**
 * C1 stub for the D13 contact reveal.
 *
 * The handle is never part of the registry payload. At C3 this is replaced by a
 * call to the reveal endpoint, made only when the guest explicitly asks for it.
 */
export const DEMO_PAYMENT_HANDLE: PaymentHandle = {
  method: "bit",
  handle: "050-123-4567",
  displayName: "נועה",
};
