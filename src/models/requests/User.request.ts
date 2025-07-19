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
export interface ResetPasswordRequest {
  forgot_password_token: string
  password: string
  confirm_password: string
}
export interface UpdateMeRequest {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
  password?: string
}
export interface FollowUserRequest {
  followed_user_id: string
}
