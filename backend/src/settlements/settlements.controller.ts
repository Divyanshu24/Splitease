import { Controller, Get, Post, Param, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettlementsService, Transaction, UserBalance } from './settlements.service';

class RecordSettlementDto {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

@Controller('settlements')
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) {}

  @Get('group/:groupId')
  getGroupSettlements(@Param('groupId') groupId: string, @Request() req): Promise<{ balances: UserBalance[]; transactions: Transaction[] }> {
    return this.settlementsService.getGroupSettlements(groupId, req.user.id);
  }

  @Post('group/:groupId/settle')
  recordSettlement(
    @Param('groupId') groupId: string,
    @Body() dto: RecordSettlementDto,
    @Request() req,
  ) {
    return this.settlementsService.recordSettlement(
      groupId,
      dto.fromUserId,
      dto.toUserId,
      dto.amount,
      req.user.id,
    );
  }

  @Get('group/:groupId/history')
  getSettlementHistory(@Param('groupId') groupId: string, @Request() req) {
    return this.settlementsService.getGroupSettlementHistory(groupId, req.user.id);
  }
}
