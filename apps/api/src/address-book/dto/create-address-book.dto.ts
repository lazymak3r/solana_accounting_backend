import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsUrl, ValidateIf } from 'class-validator'
import { AddressBookType } from '../address-book.interface'

export class CreateAddressBookDto {
  /**
   * Overview
   */
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  readonly companyName: string

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  readonly type: AddressBookType

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  readonly primaryContact: string

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  readonly me: boolean

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly displayContact: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly phone: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsEmail()
  @ValidateIf(e => e.email !== '') // expected to allow empty string by skipping @IsEmail
  readonly email: string = ''

  /**
   * Address
   */
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  readonly address: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly country: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly city: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly zip: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly department: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly discord: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly messenger: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsUrl()
  @ValidateIf(e => e.website !== '') // expected to allow empty string by skipping @IsUrl
  readonly website: string = ''

  /**
   * Remark
   */
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly remark: string = ''

  /**
   * Other
   */
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly fiatCurrency: string = ''

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  readonly taxRate: string = ''
}

