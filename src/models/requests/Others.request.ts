import { Query } from 'express-serve-static-core'
export interface PaginationQuery extends Query {
  page: string
  limit: string
}
