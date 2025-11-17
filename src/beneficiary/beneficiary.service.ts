import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Beneficiary } from "../beneficiary/schemas/beneficiary.schemas"
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';

@Injectable()
export class BeneficiaryService {
  constructor(
    @InjectModel(Beneficiary.name)
    private readonly beneficiaryModel: Model<Beneficiary>,
  ) {}

  async createMany(
    billingId: string,
    beneficiaries: CreateBeneficiaryDto[],
  ) {
    const data = beneficiaries.map((b) => ({
      ...b,
      billingId,
    }));

    return this.beneficiaryModel.insertMany(data);
  }

  async findAllByBilling(billingId: string) {
    return this.beneficiaryModel.find({ billingId }).exec();
  }

  async deleteAllByBilling(billingId: string) {
    return this.beneficiaryModel.deleteMany({ billingId }).exec();
  }
}
