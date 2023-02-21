import { IAccountProperties } from '../account/account.interface'
import { IAddressBookProperties } from '../address-book/address-book.interface'

export interface IAccountAddressBookProperties extends IAccountProperties {
  addressBook?: IAddressBookProperties
}
