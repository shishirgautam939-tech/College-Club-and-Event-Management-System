import api from "./axios";

// ── Student: Khalti payment flow ──

// Start a payment for a paid event. Returns { pidx, payment_url, amount }.
// The caller redirects the browser to payment_url.
export const initiatePayment = (eventId) =>
  api.post(`payments/events/${eventId}/initiate/`, {
    return_url: `${window.location.origin}/payment/callback`,
  });

// Verify a payment by pidx after Khalti redirects back. The backend does the
// authoritative server-side lookup and finalizes the registration. `status`
// (from the return URL) is only used by the local mock checkout; for real
// payments the backend ignores it and verifies against Khalti.
export const verifyPayment = (pidx, status) =>
  api.post("payments/verify/", status ? { pidx, status } : { pidx });

// Student's payment history.
export const getMyPayments = () => api.get("payments/my/");
