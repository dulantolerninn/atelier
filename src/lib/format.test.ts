import { describe, expect, it } from "vitest";
import { relativeTime } from "./format";

const now = new Date("2026-10-11T12:00:00Z").getTime();

describe("relativeTime", () => {
  it("describe el pasado en español", () => {
    expect(relativeTime("2026-10-11T11:59:40Z", now)).toBe("justo ahora");
    expect(relativeTime("2026-10-11T11:30:00Z", now)).toBe("hace 30 minutos");
    expect(relativeTime("2026-10-11T09:00:00Z", now)).toBe("hace 3 horas");
    expect(relativeTime("2026-10-10T12:00:00Z", now)).toBe("ayer");
  });

  it("devuelve cadena vacía con fechas inválidas", () => {
    expect(relativeTime("no-es-fecha", now)).toBe("");
  });
});
