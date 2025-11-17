import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateBillingDto,
  ) {
    return this.billingService.processTxtAndCreateBilling(file, dto);
  }

  @Post()
  async create(@Body() dto: CreateBillingDto) {
    return this.billingService.create(dto);
  }

  @Get()
  async findAll() {
    return this.billingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string) {
    return this.billingService.downloadProcessedFile(id); 
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await return this.billingService.remove(id);
  }
}
