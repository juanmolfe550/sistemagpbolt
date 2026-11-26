import type { MetaDescriptor } from "@tanstack/react-start";

export function getHeadMeta(): MetaDescriptor[] {
  return [
    { title: "Sistema de Producción" },
    {
      name: "description",
      content: "Sistema de gestión de producción y órdenes de trabajo",
    },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ];
}
