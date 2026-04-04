import { z } from "zod";

const uuidSchema = z.string().uuid();

export function sanitizeUuidArray(ids: string[], maxItems = 200) {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

  if (uniqueIds.length === 0) {
    throw new Error("At least one UUID is required");
  }

  if (uniqueIds.length > maxItems) {
    throw new Error(`Maximum ${maxItems} UUIDs allowed per request`);
  }

  uniqueIds.forEach((id) => {
    uuidSchema.parse(id);
  });

  return uniqueIds;
}
