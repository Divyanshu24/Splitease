import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(dto, req.user.id);
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string, @Request() req) {
    return this.expensesService.findByGroup(groupId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.expensesService.delete(id, req.user.id);
  }
}
