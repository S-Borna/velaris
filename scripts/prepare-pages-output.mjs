// Copyright (c) Said Borna. All rights reserved.
import { cpSync, writeFileSync } from "node:fs";

const OUTPUT_DIR = ".open-next/assets";
const ROUTES_FILE_PATH = `${OUTPUT_DIR}/_routes.json`;

function preparePagesOutput() {
  cpSync(".open-next/worker.js", `${OUTPUT_DIR}/_worker.js`);
  cpSync(".open-next/cloudflare", `${OUTPUT_DIR}/cloudflare`, { recursive: true });
  cpSync(".open-next/middleware", `${OUTPUT_DIR}/middleware`, { recursive: true });
  cpSync(".open-next/server-functions", `${OUTPUT_DIR}/server-functions`, {
    recursive: true,
  });
  cpSync(".open-next/.build", `${OUTPUT_DIR}/.build`, { recursive: true });

  const routes = {
    version: 1,
    include: ["/*"],
    exclude: ["/_next/static/*", "/favicon.ico", "/robots.txt", "/sitemap.xml"],
  };

  writeFileSync(ROUTES_FILE_PATH, `${JSON.stringify(routes, null, 2)}\n`, {
    encoding: "utf-8",
  });
}

preparePagesOutput();
