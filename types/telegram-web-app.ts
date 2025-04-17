export interface WebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface WebAppInitData {
  query_id?: string
  user?: WebAppUser
  auth_date?: string
  hash?: string
}

export interface WebApp {
  initData: string
  initDataUnsafe: WebAppInitData
  version: string
  platform: string
  colorScheme: string
  themeParams: {
    bg_color: string
    text_color: string
    hint_color: string
    link_color: string
    button_color: string
    button_text_color: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  ready(): void
  expand(): void
  close(): void
}
