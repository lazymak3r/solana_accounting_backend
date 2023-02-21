import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'
import { PublicKey } from '@solana/web3.js'
import { IsPublicKeyRule } from '../../../../../libs/core'

export class SyncAccountTransactionsDto {
  @ApiProperty({ description: 'Account', example: '8YghoouZpkbjdnE2ebs18ka9HkFkrmmZdSZo77DNmxCq' })
  @IsString()
  @IsPublicKeyRule()
  readonly account: string

  @ApiProperty({ description: 'Limit', example: 10 })
  @IsNumber()
  @IsOptional()
  readonly limit?: number
}

export class FindTransactionsDto {
  @ApiProperty({ description: 'Start date', example: '2022-12-14' })
  @IsString()
  @IsOptional()
  readonly startDate?: string

  @ApiProperty({ description: 'End date', example: '2022-12-26' })
  @IsString()
  @IsOptional()
  readonly endDate?: string

  @ApiProperty({
    description: 'Accounts',
    example: [
      'BPs8kKght8xCWuNw3Ggi34TzxVuRB66VQ2sd6KCVqF6r',
      '8YghoouZpkbjdnE2ebs18ka9HkFkrmmZdSZo77DNmxCq',
    ],
  })
  @IsArray()
  @IsOptional()
  @IsPublicKeyRule()
  readonly accounts?: PublicKey[]
}
