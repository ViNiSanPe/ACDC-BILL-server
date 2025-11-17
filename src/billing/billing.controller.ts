import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import express from 'express';
import { Res } from '@nestjs/common';
import { Multer } from 'multer';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

@Post()
@UseInterceptors(FileInterceptor('file'))
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: CreateBillingDto,
) {
  return this.billingService.create(file, dto);
}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.billingService.findById(id);
  }

 @Get('download/:product')
async downloadByProduct(
  @Param('product') product: string,
  @Res() res: express.Response,
) {
  return this.billingService.downloadByProduct(product, res);
}

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.billingService.delete(id);
  }

  @Post('create-many')
  async createMany(@Body() dtoArray: CreateBillingDto[]) {
    return this.billingService.createMany(dtoArray);
  }

  @Get(':billingId/beneficiaries')
  async findAllByBilling(@Param('billingId') billingId: string) {
    return this.billingService.findAllByBilling(billingId);
  }

  @Delete(':billingId/beneficiaries')
  async deleteAllByBilling(@Param('billingId') billingId: string) {
    return this.billingService.deleteAllByBilling(billingId);
  }
}
