// Локации
export interface TimewebLocation {
  id: string;
  description: string;
  country: string;
  city: string;
  availability_zones: string[];
}

// API-ключи
export interface TimewebAPIKey {
  id: string;
  name: string;
  token: string;
  created_at: string;
  expires_at: string | null;
}

// Аккаунт
export interface TimewebAccountStatus {
  is_blocked: boolean;
  is_permanent_blocked: boolean;
  company_info: {
    name: string;
    inn: string;
  } | null;
  last_password_changed_at: string | null;
  ym_client_id: string | null;
}

export interface TimewebNotificationSetting {
  id: string;
  type: string;
  channel: string;
  is_enabled: boolean;
}
