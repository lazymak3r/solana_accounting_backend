import { IsNumber, IsOptional, IsString } from 'class-validator'

export class IQueryGroupDto {
  @IsNumber()
  @IsOptional()
  readonly limit?: number

  @IsNumber()
  @IsOptional()
  readonly offset?: number

  @IsString()
  @IsOptional()
  readonly id?: string
}

