import { Node } from 'neo4j-driver'
import { ITaskProperties } from '@app/api/src/task/task.interface'

export class TaskEntity {
  id: string
  amount: number
  progress: number
  transferCount: number
  syncedSignatures: string[]
  createdAt: number

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.amount = this.node.properties.amount
    this.progress = this.node.properties.progress
    this.transferCount = this.node.properties.transferCount
    this.syncedSignatures = this.node.properties.syncedSignatures
    this.createdAt = this.node.properties.createdAt
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): ITaskProperties {
    const properties = this.node.properties
    return properties as ITaskProperties
  }
}
