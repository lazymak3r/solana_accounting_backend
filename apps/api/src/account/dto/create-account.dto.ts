import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { IsPublicKeyRule } from '../../../../../libs/core'
import { AccountTypeEnum } from '../account.interface'

export class CreateAccountDto {
  @ApiProperty({ description: 'Account address', example: '6y2vwRHMM4Yj9LWwdsdWeAMHJ7zrYsoAcXmxtCjbbJtB' })
  @IsPublicKeyRule()
  readonly address: string

  @ApiProperty({
    enum: AccountTypeEnum,
    default: AccountTypeEnum.Account,
  })
  @IsString()
  readonly type: AccountTypeEnum

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  readonly me: boolean

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly displayName?: string
}

