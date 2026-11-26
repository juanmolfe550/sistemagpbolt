import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

const fetch = createStartHandler({
  createRouter: getRouter,
})(defaultStreamHandler);

export default { fetch };
