import validator from "validator";

export const sanitizeBody = (value) => {
  if (typeof value === "string") return validator.escape(value.trim());
  if (Array.isArray(value)) return value.map(sanitizeBody);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        key === "photoData" || key === "attachmentData" ? val : sanitizeBody(val)
      ])
    );
  }
  return value;
};
