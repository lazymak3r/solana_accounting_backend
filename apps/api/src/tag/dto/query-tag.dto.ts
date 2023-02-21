import { IsNumber, IsOptional, IsString } from 'class-validator'

export class IQueryTagDto {
  @IsString()
  readonly entity: string

  @IsNumber()
  @IsOptional()
  readonly limit?: number

  @IsNumber()
  @IsOptional()
  readonly offset?: number
}

