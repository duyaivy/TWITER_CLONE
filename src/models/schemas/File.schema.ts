import { MediaType } from '~/constants/enum'

export default class Media {
  url: string
  type: MediaType

  constructor({ url, type }: { url: string; type: MediaType }) {
    this.url = url
    this.type = type
  }
}
