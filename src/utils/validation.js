// Form validation rules. Every function returns an error message or null.
import { settings } from "../data";

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

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(value) {
  const email = value.trim().toLowerCase();
  if (!email) return "Email is required.";
  if (!email.endsWith(settings.emailDomain)) return `Use your university email (ending with ${settings.emailDomain}).`;
  if (!/^[a-z0-9._-]+@ua\.edu\.lb$/.test(email)) return "This email address is not valid.";
  return null;
}

// Login only needs the password to be filled in.
export const validateRequired = (value, label) => (value.trim() ? null : `${label} is required.`);

export function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password must contain letters and numbers.";
  return null;
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return "Please confirm your password.";
  return password === confirm ? null : "Passwords do not match.";
}

export function validateFullName(value) {
  const name = value.trim();
  if (!name) return "Full name is required.";
  if (name.split(/\s+/).length < 2) return "Enter your first and last name.";
  if (!/^[\p{L}\s'-]+$/u.test(name)) return "Name can only contain letters.";
  return null;
}

// Student ID: 9 digits (e.g. 202312345). Staff ID: "ST" + 5 digits (e.g. ST10234).
export function validateUniversityId(value) {
  const id = value.trim().toUpperCase();
  if (!id) return "Student/Staff ID is required.";
  if (!/^\d{9}$/.test(id) && !/^ST\d{5}$/.test(id)) {
    return "Student ID: 9 digits (e.g. 202312345). Staff ID: ST + 5 digits (e.g. ST10234).";
  }
  return null;
}

export const validateFaculty = (value) => (value ? null : "Please choose your faculty.");

// Lebanese mobile number: 8 digits, e.g. 71123456 or 03123456.
export function validatePhone(value) {
  const phone = value.replace(/[\s-]/g, "").replace(/^\+961/, "");
  if (!phone) return "Phone number is required.";
  if (!/^\d{8}$/.test(phone)) return "Enter an 8-digit Lebanese number (e.g. 71123456).";
  return null;
}

// Runs a { field: validatorFn } map and returns { field: message } for the failing ones.
export function runValidators(validators) {
  const errors = {};
  Object.entries(validators).forEach(([field, check]) => {
    const message = check();
    if (message) errors[field] = message;
  });
  return errors;
}
