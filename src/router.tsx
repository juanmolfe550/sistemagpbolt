import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    history: createHashHistory(),
  });
}

export type Router = ReturnType<typeof getRouter>;
