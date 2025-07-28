import { nanoid } from 'nanoid'

export const randomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?'
  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}
export const randomUsername = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + nanoid(6)
}
