import { IAccountProperties } from '../account/account.interface'
import { ITagProperties } from '../tag/tag.interface'
import { IAddressBookProperties } from './address-book.interface'

export interface IAddressBookResponse extends IAddressBookProperties {
  account?: IAccountProperties
  tags: ITagProperties[]
}
