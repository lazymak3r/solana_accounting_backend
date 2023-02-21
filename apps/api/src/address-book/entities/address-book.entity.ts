import { Node } from 'neo4j-driver'
import { AddressBookType, IAddressBookProperties } from '../address-book.interface'

export class AddressBook {
  id: string
  companyName: string
  address: string
  type: AddressBookType
  primaryContact: string
  displayContact?: string
  phone?: string
  email?: string
  country?: string
  city?: string
  zip?: string
  department?: string
  discord?: string
  messenger?: string
  website?: string
  fiatCurrency?: string
  taxRate?: string
  remark?: string

  constructor(private readonly node: Node) {
    this.id = this.node.properties.id
    this.companyName = this.node.properties.companyName
    this.address = this.node.properties.address
    this.type = this.node.properties.type
    this.primaryContact = this.node.properties.primaryContact
    this.displayContact = this.node.properties.displayContact
    this.phone = this.node.properties.phone
    this.email = this.node.properties.email
    this.country = this.node.properties.country
    this.city = this.node.properties.city
    this.zip = this.node.properties.zip
    this.department = this.node.properties.department
    this.discord = this.node.properties.discord
    this.messenger = this.node.properties.messenger
    this.website = this.node.properties.website
    this.fiatCurrency = this.node.properties.fiatCurrency
    this.taxRate = this.node.properties.taxRate
    this.remark = this.node.properties.remark
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): IAddressBookProperties {
    const properties = this.node.properties
    return properties as IAddressBookProperties
  }
}
