import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BillingModule } from "./billing/billing.module";
import { BeneficiaryModule } from "./beneficiary/beneficiary.module";

@Module({
  imports: [BillingModule, BeneficiaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
