// Display helpers shared by the cart, checkout and order screens.

const BINDING_LABELS = { none: "No binding", staple: "Stapled", spiral: "Spiral binding" };

// "Large, Extra shot, Oat milk" or "12 pages · Color · Double-sided · Spiral binding"
export function describeItem(item) {
  if (item.type === "print" && item.printJob) {
    const j = item.printJob;
    return [
      `${j.pages} page${j.pages > 1 ? "s" : ""}`,
      j.color ? "Color" : "B&W",
      j.doubleSided ? "Double-sided" : "Single-sided",
      BINDING_LABELS[j.binding],
    ].join(" · ");
  }
  return [item.size?.label, ...(item.extras || []).map((e) => e.label)].filter(Boolean).join(", ");
}

// "Mon 16 Nov, 10:42"
export function formatDateTime(iso) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}, ${time}`;
}

export const formatTime = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// "Building B, Room 204"
export const locationLabel = (buildingId, room) => `Building ${buildingId}, Room ${room}`;
