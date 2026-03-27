import { IsString, IsNumber, IsUUID, IsArray, ValidateNested, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SplitTypeDto {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  EXACT = 'exact',
}

export class SplitItemDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;
}

export class CreateExpenseDto {
  @IsUUID()
  groupId: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsUUID()
  paidById: string;

  @IsEnum(SplitTypeDto)
  splitType: SplitTypeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  splits: SplitItemDto[];
}
