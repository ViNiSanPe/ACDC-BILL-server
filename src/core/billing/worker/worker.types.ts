export type WorkerMessage =
  | { batch: BeneficiaryParsed[] }
  | { error: string; line: string }
  | { finished: true; total: number }
  | { criticalError: string };

export interface BeneficiaryParsed {
  name: string;
  cpf: string;
  value: number;
  gender: string;
  birthDate: string;
  billing: string;
}
export interface BillingWorkerData {
  billingId: string;
}
