import { IAccountProperties } from '../account/account.interface'
import { IAddressBookProperties } from '../address-book/address-book.interface'
import { IGroupProperties } from '../group/group.interface'
import { ITagProperties } from '../tag/tag.interface'

export interface IAccountResponse extends IAccountProperties {
  addressBook?: IAddressBookProperties
  tags: ITagProperties[]
  group?: IGroupProperties
}
