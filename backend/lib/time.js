// Time helpers: opening hours and delivery-slot availability (same rules as the app: src/utils/time.js).
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
//this file to answer if the store open right now 
//can the customer choose this delivery slot 
// "09:45" -> 585 (minutes since midnight)

//convert between clock time and  minutes 
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// 585 -> "09:45"
export function fromMinutes(total) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const minutesOfDay = (date = new Date()) => date.getHours() * 60 + date.getMinutes();
//find today hours and decide if the store is open 
export const getTodayHours = (store, date = new Date()) => store.openingHours[DAY_KEYS[date.getDay()]];

// True when the store is open at `date`.
export function isStoreOpen(store, date = new Date()) {
  const hours = getTodayHours(store, date);
  if (!hours) return false;
  const now = minutesOfDay(date);
  return now >= toMinutes(hours.open) && now < toMinutes(hours.close);
}

// Short human text for the Open/Closed badge.
export function getStoreStatus(store, date = new Date()) {
  const hours = getTodayHours(store, date);
  const open = isStoreOpen(store, date);
  if (!hours) return { open, label: "Closed today" };
  if (open) return { open, label: `Open · closes ${hours.close}` };
  if (minutesOfDay(date) < toMinutes(hours.open)) return { open, label: `Closed · opens ${hours.open}` };
  return { open, label: "Closed for today" };
}

export const slotLabel = (slot) => `${slot.start} – ${slot.end}`;

/**
 * A slot is available when:
 *  - it has not started yet, and
 *  - there is enough time to prepare + deliver (prep time + buffer) before it starts, and
 *  - (if a store is given) the store is still open when the slot starts.
 * Returns { available, reason }.
 */
export function checkSlot(slot, { prepMinutes = 0, bufferMinutes = 5, store, date = new Date() } = {}) {
  const now = minutesOfDay(date);
  const start = toMinutes(slot.start);
  if (now >= start) return { available: false, reason: "Already passed" };
  if (start - now < prepMinutes + bufferMinutes) return { available: false, reason: "Too soon to prepare" };
  if (store) {
    const hours = getTodayHours(store, date);
    if (!hours || start > toMinutes(hours.close)) return { available: false, reason: "Store closed by then" };
  }
  return { available: true, reason: null };
}

// First slot that is still available today, or null.
export function getNextAvailableSlot(slots, options) {
  return slots.find((slot) => checkSlot(slot, options).available) || null;
}
