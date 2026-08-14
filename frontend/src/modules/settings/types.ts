export interface SystemNumberingSequence {
  module: 'Invoice' | 'Voucher' | 'Purchase' | 'Employee';
  prefix: string;
  nextNumber: number;
  paddingDigits: number;
  exampleFormatted: string;
}

export interface UserProfileSettings {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  avatarUrl: string;
  timezone: string;
}

export interface NotificationSettingsConfig {
  emailAlerts: boolean;
  pushNotifications: boolean;
  approvalReminders: boolean;
  weeklyReports: boolean;
}

export interface ApplicationSystemSettings {
  themeMode: 'Light' | 'Dark' | 'System';
  baseCurrency: 'INR' | 'USD' | 'EUR';
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  gstin: string;
  panNumber: string;
  twoFactorAuth: boolean;
  sessionTimeoutMinutes: number;
}

export interface SettingsState {
  loaded: boolean;
}
