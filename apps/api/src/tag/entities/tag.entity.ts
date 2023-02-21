import { Node } from 'neo4j-driver'
import { ITagProperties } from '../tag.interface'

export class Tag {
  id: string
  label: string
  // type: TagTypeEnum = TagTypeEnum.success

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.label = this.node.properties.label
    // this.type = this.node.properties.type
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): ITagProperties {
    const properties = this.node.properties
    return properties as ITagProperties
  }
}
