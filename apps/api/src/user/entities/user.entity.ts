import { Node } from 'neo4j-driver'

export interface IUserProperties {
  publicKey: string
  id: string
  lastSyncTimestamp?: number
}

export class UserEntity {
  publicKey: string
  id: string
  lastSyncTimestamp?: number

  constructor(private readonly node: Node) {
    this.publicKey = this.node.properties.publicKey
    this.lastSyncTimestamp = this.node.properties.lastSyncTimestamp
    this.id = this.node.properties.id
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): IUserProperties {
    const properties = this.node.properties
    return properties as IUserProperties
  }
}
