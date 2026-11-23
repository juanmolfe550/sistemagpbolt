import { describe, expect, it } from "vitest";
import { inicioDe, rutasPermitidas } from "@/lib/auth";

describe("acceso por rol", () => {
  it("administrador ve todo y entra al panel", () => {
    expect(rutasPermitidas(["admin"])).toBeNull();
    expect(inicioDe(["admin"])).toBe("/panel");
  });
  it("taller solo entra a Ejecución", () => {
    expect(rutasPermitidas(["operario"])).toEqual(["/taller"]);
  });
  it("calidad entra a su módulo", () => expect(inicioDe(["calidad"])).toBe("/calidad"));
  it("shi entra a su módulo", () => expect(inicioDe(["shi"])).toBe("/shi"));
  it("líder de proyecto entra a su módulo", () => expect(inicioDe(["lider_proyecto"])).toBe("/proyectos"));
});
