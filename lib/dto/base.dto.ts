import { Decimal } from "@prisma/client/runtime/client";


export function serializeDecimal(value: any): any {
  if (value instanceof Decimal) return value.toNumber();
  return value;
}

export function mapObject<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(mapObject) as any;

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, serializeDecimal(mapObject(v))])
  ) as T;
}
