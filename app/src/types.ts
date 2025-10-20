export interface User {
  id: number;
  email: string;
  name?: string;
  profile_image?: string;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions: string;
  start_date?: string;
  end_date?: string;
  notification_enabled: number;
  notification_id?: string;
  taken_today: number; // ✅ NOVO
  created_at: string;
}