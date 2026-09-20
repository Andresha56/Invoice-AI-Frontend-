import "dotenv/config";
import cluster from "node:cluster";
import { availableParallelism } from "node:os";

import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;
const numCPUs = availableParallelism();

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);

    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(
      `Worker ${process.pid} running on http://localhost:${PORT}`,
    );
  });
}