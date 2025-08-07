export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  ResetPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  VideoHLS
}
export enum MediaQueryType {
  Image = 'image',
  Video = 'video'
}
export enum MediaStatus {
  Processing, // đang xử lý
  Done, // đã xử lý
  Failed // xử lý thất bại
}
export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}
export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}
