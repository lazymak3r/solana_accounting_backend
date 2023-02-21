export type AddressBookType = 'Business' | 'Individual'

export interface IAddressBookProperties {
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
  me: boolean
}
