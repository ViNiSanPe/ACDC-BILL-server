import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Billing } from './schemas/billing.schema';
import { BeneficiaryService } from '../beneficiary/beneficiary.service';
import { CreateBillingDto } from './dto/create-billing.dto';

import { Readable } from 'stream';
import { createInterface } from 'readline';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { Response } from 'express';
import { Multer } from 'multer';

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

      const readable = Readable.from(file.buffer);
    
      const worker = new Worker(
        join(__dirname, 'worker', 'processTxt.worker.js'),
        { workerData: { billingId: billing._id.toString() } },
      );

      const rl = createInterface({
        input: readable,
        crlfDelay: Infinity,
      });

      return new Promise((resolve, reject) => {
      
        rl.on('line', (line) => {
          worker.postMessage({ line });
        });

        rl.on('close', () => {
          worker.postMessage({ done: true });
        });

        worker.on('message', async (msg) => {
          if (msg.batch) {
            await this.beneficiaryService.createMany(msg.batch);
          }

          if (msg.finished) {
            resolve({
              message: 'Processamento concluído!',
              billingId: billing._id,
              totalBeneficiaries: msg.total,
            });
          }
        });

        worker.on('error', (err) => {
          reject(err);
        });
      });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findById(id: string) {
    const billing = await this.billingModel.findById(id);
    if (!billing) throw new NotFoundException('Billing não encontrado');
    return billing;
  }

  async delete(id: string) {
    const billing = await this.billingModel.findById(id);
    if (!billing) throw new NotFoundException('Billing não encontrado');

    await this.beneficiaryService.deleteAllByBilling(id);
    await this.billingModel.deleteOne({ _id: id });

    return { message: 'Billing e beneficiários removidos' };
  }

  async downloadByProduct(product: string, res: Response) {
    const billings = await this.billingModel.find({ product });

    if (!billings.length) {
      throw new NotFoundException('Nenhum billing encontrado para o produto');
    }

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${product}-report.txt"`,
    });

    const stream = new Readable({
      read() {},
    });
  
    for (const bill of billings) {
      stream.push(`Company: ${bill.company}\n`);
      stream.push(`Product: ${bill.product}\n`);
      stream.push(`Value: ${bill.value}\n`);
      stream.push(`Total Lives: ${bill.totalLives}\n`);
      stream.push('------------------------------\n');
    }

    stream.push(null);

    stream.pipe(res);
  }
}
