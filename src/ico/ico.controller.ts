import { Controller, Post, Get, Body } from '@nestjs/common';
import { IcoService } from './ico.service';
// dto/purchase.dto.ts
export class PurchaseDto {
  buyer: string;
  stageId: string;
  txHash: string;
  tokens: number;
  amount: number;
  rewards: {
    wallet: string;
    amount: number;
  }[];
}

@Controller('ico')
export class IcoController {
  constructor(private readonly icoService: IcoService) {}

@Post('create')
async create(@Body() body) {
  // minimal validation
  if (!body.title || !body.price || !body.start || !body.end) {
    throw new Error("Invalid ICO data");
  }

  return this.icoService.create({
    title: body.title,
    price: body.price,
    start: body.start,
    end: body.end,
    minBuy: body.minBuy,
    maxBuy: body.maxBuy,
    hardCap: body.hardCap,
    sold: "0",
    active: true,
    phaseIndex: body.phaseIndex, // 👈 IMPORTANT
  });
}

@Get("all")
  async getAll() {
    return this.icoService.findAll();
  }
  // 👤 User
  @Get('active')
  getActive() {
    return this.icoService.getActive();
  }

  @Post('purchase-complete')
    async purchaseComplete(@Body() body: PurchaseDto) {
    return this.icoService.completePurchase(body);
    }

}
