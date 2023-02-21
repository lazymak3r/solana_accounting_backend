import { Node } from 'neo4j-driver'
import { ITaskProperties } from '../task.interface'

export class Task {
  id: string
  amount: number
  progress: number

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.amount = this.node.properties.label
    this.progress = this.node.properties.progress
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): ITaskProperties {
    const properties = this.node.properties
    return properties as ITaskProperties
  }
}
