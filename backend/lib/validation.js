/*
 * Validation rules (same rules as the mobile app's src/utils/validation.js).
 * The app checks them to show errors quickly; the server checks them AGAIN
 * because a request could come from anywhere, not only from our app.
 * Every function returns an error message or null.
 */

export const EMAIL_DOMAIN = "@ua.edu.lb";
export const PASSWORD_MIN_LENGTH = 8;

export const FACULTIES = [
  "Engineering",
  "Business",
  "Sciences",
  "Health Sciences",
  "Music & Musicology",
  "Education",
  "Information & Communication",
  "Architecture",
];

// Turns anything into a string so the rules never crash on bad input.
const str = (value) => (typeof value === "string" ? value : "");

export function validateEmail(value) {
  const email = str(value).trim().toLowerCase();
  if (!email) return "Email is required.";
  if (!email.endsWith(EMAIL_DOMAIN)) return `Use your university email (ending with ${EMAIL_DOMAIN}).`;
  if (!/^[a-z0-9._-]+@ua\.edu\.lb$/.test(email)) return "This email address is not valid.";
  return null;
}

export const validateRequired = (value, label) => (str(value).trim() ? null : `${label} is required.`);

export function validatePassword(value) {
  const password = str(value);
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain letters and numbers.";
  return null;
}

export function validateFullName(value) {
  const name = str(value).trim();
  if (!name) return "Full name is required.";
  if (name.split(/\s+/).length < 2) return "Enter your first and last name.";
  if (!/^[\p{L}\s'-]+$/u.test(name)) return "Name can only contain letters.";
  return null;
}

// Student ID: 9 digits (e.g. 202312345). Staff ID: "ST" + 5 digits (e.g. ST10234).
export function validateUniversityId(value) {
  const id = str(value).trim().toUpperCase();
  if (!id) return "Student/Staff ID is required.";
  if (!/^\d{9}$/.test(id) && !/^ST\d{5}$/.test(id)) {
    return "Student ID: 9 digits (e.g. 202312345). Staff ID: ST + 5 digits (e.g. ST10234).";
  }
  return null;
}

export const validateFaculty = (value) => (FACULTIES.includes(value) ? null : "Please choose your faculty.");

export const cleanPhone = (value) => str(value).replace(/[\s-]/g, "").replace(/^\+961/, "");

// Lebanese mobile number: 8 digits, e.g. 71123456 or 03123456.
export function validatePhone(value) {
  const phone = cleanPhone(value);
  if (!phone) return "Phone number is required.";
  if (!/^\d{8}$/.test(phone)) return "Enter an 8-digit Lebanese number (e.g. 71123456).";
  return null;
}

// Room: 1–6 letters/digits containing at least one digit (e.g. 204, B12, 3A).
export function validateRoom(value) {
  const room = str(value).trim();
  if (!room) return "Room number is required.";
  if (!/^[A-Za-z0-9-]{1,6}$/.test(room) || !/\d/.test(room)) return "Enter a valid room (e.g. 204 or B12).";
  return null;
}

// Runs { field: () => message } and returns { field: message } for the failing ones.
export function runValidators(validators) {
  const errors = {};
  Object.entries(validators).forEach(([field, check]) => {
    const message = check();
    if (message) errors[field] = message;
  });
  return errors;
}
