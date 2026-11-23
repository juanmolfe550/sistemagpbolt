import { describe, expect, it } from "vitest";
import { desviacionDias, desviacionHH, diasHabiles, fmtDesviacionHH, fmtTiempoEntrega } from "@/lib/calculos";

describe("desviación HH", () => {
  it("120 ejecutadas vs 100 planificadas = +20 %", () => expect(desviacionHH(100, 120)).toBe(20));
  it("80 ejecutadas vs 100 planificadas = -20 %", () => expect(desviacionHH(100, 80)).toBe(-20));
  it("sin HH ejecutadas no da cero ficticio", () => {
    expect(fmtDesviacionHH(100, null)).toBe("Pendiente de cálculo");
    expect(fmtDesviacionHH(100, 0)).toBe("Pendiente de cálculo");
  });
  it("plan cero no es calculable", () => expect(fmtDesviacionHH(0, 50)).toBe("No calculable"));
});

describe("desviación de fechas", () => {
  it("sin fin real queda pendiente", () => expect(desviacionDias("2026-10-05", null)).toBeNull());
  it("2 días tarde = +2", () => expect(desviacionDias("2026-10-09", "2026-10-11")).toBe(2));
});

describe("tiempo de entrega", () => {
  it("lunes a viernes = 5 días / 40 horas", () => expect(fmtTiempoEntrega("2026-10-05", "2026-10-09")).toBe("5 días hábiles / 40 horas"));
  it("excluye fin de semana (jueves a martes = 4)", () => expect(diasHabiles("2026-10-08", "2026-10-13")).toBe(4));
  it("fin antes del inicio es error", () => expect(diasHabiles("2026-10-09", "2026-10-05")).toBe("error"));
  it("mismo día hábil = 1 día", () => expect(diasHabiles("2026-10-05", "2026-10-05")).toBe(1));
});
