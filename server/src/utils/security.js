export const sanitizeBody = (value) => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(sanitizeBody);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key))
        .map(([key, val]) => [key, key === "photoData" || key === "attachmentData" ? val : sanitizeBody(val)])
    );
  }
  return value;
};
