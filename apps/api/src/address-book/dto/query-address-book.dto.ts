import { IsNumber, IsOptional, IsString } from 'class-validator'

export class IQueryAddressBookDto {
  @IsString()
  @IsOptional()
  readonly publicKey?: string

  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[]

  @IsString()
  @IsOptional()
  readonly withAccount?: string

  @IsNumber()
  @IsOptional()
  readonly limit?: number

  @IsNumber()
  @IsOptional()
  readonly offset?: number

  @IsString()
  @IsOptional()
  readonly order?: 'asc' | 'desc'

  @IsString()
  @IsOptional()
  readonly id?: string
}

