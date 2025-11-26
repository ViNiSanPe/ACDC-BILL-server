import { parentPort, workerData } from "worker_threads";
import {
  BeneficiaryParsed,
  BillingWorkerData,
  WorkerMessage,
} from "./worker.types";

const BATCH_SIZE = 500;

const data = workerData as BillingWorkerData;

let batch: BeneficiaryParsed[] = [];
let total = 0;

parentPort?.on("message", (msg: { line?: string; done?: boolean }) => {
  try {
    if (msg.line) {
      const parsed = parseLine(msg.line);

      if (parsed) {
        batch.push(parsed);
      }

      total++;

      if (batch.length >= BATCH_SIZE) {
        parentPort?.postMessage({ batch });
        batch = [];
      }
    }

    if (msg.done) {
      if (batch.length > 0) {
        parentPort?.postMessage({ batch });
      }

      parentPort?.postMessage({
        finished: true,
        total,
      } satisfies WorkerMessage);
    }
  } catch (err) {
    parentPort?.postMessage({
      criticalError: (err as Error).message,
    } satisfies WorkerMessage);

    process.exit(1);
  }
});

function parseLine(line: string): BeneficiaryParsed | null {
  if (!line.includes(";")) {
    throw new Error(`Linha completamente inválida: "${line}"`);
  }

  const parts = line.split(";");

  if (parts.length < 5) {
    parentPort?.postMessage({
      error: "Formato inválido, campos faltando",
      line,
    });
    return null;
  }

  const [name, cpf, valueStr, gender, birthDate] = parts;

  const value = Number(valueStr);
  if (isNaN(value)) {
    parentPort?.postMessage({
      error: `Valor inválido: "${valueStr}"`,
      line,
    });
    return null;
  }

  if (!name.trim()) {
    parentPort?.postMessage({ error: "Nome vazio", line });
    return null;
  }

  if (!cpf.trim()) {
    parentPort?.postMessage({ error: "CPF vazio", line });
    return null;
  }

  if (!birthDate.trim()) {
    parentPort?.postMessage({ error: "Data de nascimento faltando", line });
    return null;
  }

  return {
    name,
    cpf,
    value,
    gender,
    birthDate,
    billing: data.billingId,
  };
}
