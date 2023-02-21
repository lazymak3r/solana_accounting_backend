import { Transform } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class IQueryAccountDto {
  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[]

  @IsString({ each: true })
  @IsOptional()
  readonly groups?: string[]

  @IsString()
  @IsOptional()
  readonly addressBookId?: string

  @IsNumber()
  @IsOptional()
  readonly limit?: number

  @IsNumber()
  @IsOptional()
  readonly offset?: number

  @IsString()
  @IsOptional()
  readonly withAddressBook?: string

  @IsString()
  @IsOptional()
  readonly withGroup?: string

  @IsString()
  @IsOptional()
  readonly selectedGroupId?: string

  @IsString()
  @IsOptional()
  readonly id?: string

  @IsBoolean()
  @IsOptional()
  @Transform((query) => {
    return query.obj[query.key] === 'true'
  })
  readonly me?: boolean

  @IsString()
  @IsOptional()
  readonly query?: string
}
