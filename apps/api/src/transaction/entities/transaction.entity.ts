import { Node } from 'neo4j-driver'
import { PublicKey } from '@solana/web3.js'
import { TransactionAccount, TransactionProperties } from '../transaction.interface'

export class Transaction {
  args: string
  blockTime: string
  fee: number
  id: string
  parsedType?: string
  programId: PublicKey
  signature: string
  slot: number
  status: string
  err?: string | null

  constructor(private readonly node: Node) {
    this.args = this.node.properties.args
    this.blockTime = this.node.properties.blockTime
    this.fee = this.node.properties.fee
    this.id = this.node.properties.id
    this.parsedType = this.node.properties.parsedType
    this.programId = this.node.properties.programId
    this.signature = this.node.properties.signature
    this.slot = this.node.properties.slot
    this.status = this.node.properties.status
    this.err = this.node.properties.err
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): TransactionProperties {
    const properties = this.node.properties
    return properties as TransactionProperties
  }
}

export class TransactionAccountEntity {
  id: string
  name: string
  isSigner: string
  isWritable: string
  pubkey: PublicKey
  postBalance: number
  preBalance: number

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.name = this.node.properties.name
    this.isSigner = this.node.properties.isSigner
    this.isWritable = this.node.properties.isWritable
    this.pubkey = this.node.properties.pubkey
    this.postBalance = this.node.properties.postBalance
    this.preBalance = this.node.properties.preBalance
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): TransactionAccount {
    const properties = this.node.properties
    return properties as TransactionAccount
  }
}
