import { Node } from 'neo4j-driver'
import { IGroupProperties } from '../group.interface'

export class Group {
  id: string
  label: string
  // type: GroupTypeEnum = GroupTypeEnum.success

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.label = this.node.properties.label
    // this.type = this.node.properties.type
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): IGroupProperties {
    const properties = this.node.properties
    return properties as IGroupProperties
  }
}
