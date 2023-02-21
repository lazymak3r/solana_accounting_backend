import { PublicKey } from '@solana/web3.js'

export interface TransactionProperties {
  args: string
  blockTime: string
  fee: number
  id: string
  parsedType?: string
  programId: PublicKey
  signature: string
  slot: number
  status: string
  solPrice: number
  err?: string | null
}

export interface TransactionAccount {
  id: string
  name: string
  isSigner: boolean
  isWritable: boolean
  pubkey: PublicKey
  postBalance: string
  preBalance: string
}

export interface TransactionReturnType extends TransactionProperties {
  accounts: TransactionAccount[]
}
