export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface RegisterResponse {
  message: string
  data: {
    _id: string
    name: string
    email: string
    date_of_birth: string
    created_at: Date
    updated_at: Date
  }
}
