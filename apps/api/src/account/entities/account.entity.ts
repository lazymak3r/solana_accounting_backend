import { Node } from 'neo4j-driver'
import { AccountTypeEnum, IAccountProperties, IAccountTypeProperties } from '../account.interface'

export class Account {
  id: string
  address: string
  me = false
  type: AccountTypeEnum = AccountTypeEnum.Account
  displayName?: string

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.address = this.node.properties.address
    this.me = this.node.properties.me
    this.type = this.node.properties.type
    this.displayName = this.node.properties.displayName
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): IAccountProperties {
    const properties = this.node.properties
    return properties as IAccountProperties
  }
}

export class AccountType {
  type: AccountTypeEnum

  constructor(private readonly node: Node) {
    this.type = this.node.properties.type
  }

  toJson(): IAccountTypeProperties {
    const properties = this.node.properties
    return properties as IAccountTypeProperties
  }
}
