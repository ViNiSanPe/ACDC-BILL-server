import { Worker } from "worker_threads";
import { join } from "path";
import { BeneficiaryParsed, WorkerMessage } from "./worker.types";

export class WorkerManager {
  private worker: Worker;

  constructor(private billingId: string) {
    this.worker = new Worker(join(__dirname, "processTxt.worker.js"), {
      workerData: { billingId },
    });
  }

  process(
    onBatch: (batch: BeneficiaryParsed[]) => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worker.on("message", (raw: unknown) => {
        void (async () => {
          const msg = raw as WorkerMessage;

          if ("batch" in msg) {
            await onBatch(msg.batch);
          }

          if ("finished" in msg) {
            resolve();
          }
        })();
      });

      this.worker.on("error", reject);

      this.worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  sendLine(line: string) {
    this.worker.postMessage({ line });
  }

  finish() {
    this.worker.postMessage({ done: true });
  }
}
