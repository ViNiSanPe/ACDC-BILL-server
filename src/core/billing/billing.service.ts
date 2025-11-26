import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Billing } from "./schemas/billing.schema";
import { BeneficiaryService } from "../beneficiary/beneficiary.service";
import { CreateBillingDto } from "./dto/create-billing.dto";

import { Readable } from "stream";
import { createInterface } from "readline";
import { Response } from "express";

import { WorkerManager } from "./worker/worker.manager";

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name)
    private readonly billingModel: Model<Billing>,
    private readonly beneficiaryService: BeneficiaryService,
  ) {}

  async create(file: Express.Multer.File, dto: CreateBillingDto) {
    try {
      const billing = await this.billingModel.create(dto);

      const manager = new WorkerManager(billing._id.toString());
      await manager.process(async (batch) => {
        await this.beneficiaryService.createMany(billing._id.toString(), batch);
      });

      const readable = Readable.from(file.buffer);
      const rl = createInterface({
        input: readable,
        crlfDelay: Infinity,
      });

      rl.on("line", (line: string) => {
        manager.sendLine(line);
      });

      rl.on("close", () => {
        manager.finish();
      });

      return {
        message: "Processing completed!",
        billingId: billing._id,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : "Error processing billing",
      );
    }
  }

  async findById(id: string) {
    const billing = await this.billingModel.findById(id).exec();
    if (!billing) throw new NotFoundException("Billing not found");
    return billing;
  }

  async downloadByProduct(product: string, res: Response) {
    const billings = await this.billingModel.find({ product }).exec();

    if (!billings.length) {
      throw new NotFoundException(`No billings found for product: ${product}`);
    }

    res.set({
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${product}-report.txt"`,
    });

    const stream = new Readable({
      read() {},
    });

    for (const bill of billings) {
      stream.push(`Company: ${bill.company}\n`);
      stream.push(`Product: ${bill.product}\n`);
      stream.push(`Value: ${bill.value}\n`);
      stream.push(`Total Lives: ${bill.totalLives}\n`);
      stream.push("-------------------- ----------\n");
    }

    stream.push(null);
    stream.pipe(res);
  }

  async delete(id: string) {
    const billing = await this.billingModel.findById(id).exec();

    if (!billing) {
      throw new NotFoundException("Billing not found");
    }

    await this.beneficiaryService.deleteAllByBilling(id);
    await this.billingModel.deleteOne({ _id: id });

    return { message: "Billing and Beneficiaries successfully removed" };
  }
}
