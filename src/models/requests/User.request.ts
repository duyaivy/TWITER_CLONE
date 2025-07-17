export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LoginRequest {
  email: string
  password: string
}
export interface LogoutOrRefreshTokenRequest {
  refresh_token: string
}
export interface EmailVerifyRequest {
  email_verify_token: string
}
