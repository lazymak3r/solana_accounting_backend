import { ApiProperty } from '@nestjs/swagger'
import { IsArray } from 'class-validator'
import { PublicKey } from '@solana/web3.js'
import { IsPublicKeyRule } from '../../../../../libs/core'

export class GetAccountTasksDto {
  @ApiProperty({
    description: 'Accounts',
    example: [
      'BPs8kKght8xCWuNw3Ggi34TzxVuRB66VQ2sd6KCVqF6r',
      '8YghoouZpkbjdnE2ebs18ka9HkFkrmmZdSZo77DNmxCq',
    ],
  })
  @IsArray()
  @IsPublicKeyRule()
  readonly accounts: PublicKey[]
}
