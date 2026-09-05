import { buildApp } from "./app.js";
const app = await buildApp();
await app.listen({ host: "127.0.0.1", port: 4317 });
console.log("Echoes Below is running at http://127.0.0.1:4317");
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
