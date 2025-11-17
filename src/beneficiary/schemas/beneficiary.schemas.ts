import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Billing } from '../../billing/schemas/billing.schema';

export type BeneficiaryDocument = HydratedDocument<Beneficiary>;

@Schema({ timestamps: true })
export class Beneficiary {
    @Prop({ required: true })
    name: string;
  
    @Prop({ required: true })
    cpf: string;
  
    @Prop({ required: true })
    value: number;
  
    @Prop({ required: true })
    gender: string;
  
    @Prop({ required: true })
    birthDate: string;
  
    @Prop({ type: Types.ObjectId, ref: Billing.name, required: true })
    billing: Billing | Types.ObjectId;
}

export const BeneficiarySchema = SchemaFactory.createForClass(Beneficiary);