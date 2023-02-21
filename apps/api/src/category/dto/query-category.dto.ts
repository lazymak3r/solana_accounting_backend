import { IsOptional, IsString } from 'class-validator'

export class IQueryCategoryDto {
  @IsString()
  @IsOptional()
  readonly id: string

  @IsString()
  @IsOptional()
  readonly parentId: string
}

