export interface Conversation {
  id: number;
  patient_name: string;
  patient_avatar?: string;
  last_message: string;
  timestamp: string;
  unread_count: number;
  status: 'active' | 'inactive';
  ai_active?: boolean;
  has_pending_appointment?: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  type: 'received' | 'sent_system' | 'sent_ai' | 'sent_whatsapp' | 'sent_user' | 'note';
  content: string;
  timestamp: string;
  sender_name?: string;
  sender_avatar?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  media_filename?: string;
  media_size?: number;
  media_duration?: number; // for audio/video in seconds
  media_thumbnail?: string; // for video thumbnails
}

export interface SystemEvent {
  id: number;
  conversation_id: number;
  type: 'availability_check' | 'appointment_created' | 'appointment_status_changed' | 'contact_created';
  content: string;
  timestamp: string;
}

export interface TimelineItem {
  id: number;
  type: 'message' | 'event';
  timestamp: string;
  data: Message | SystemEvent;
}

export interface PatientInfo {
  id: number;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  last_appointment?: {
    date: string;
    time: string;
    doctor: string;
    specialty: string;
  };
  recent_appointments: Array<{
    date: string;
    specialty: string;
  }>;
}

export interface ConversationFilter {
  type: 'all' | 'unread' | 'ai_active' | 'manual';
  label: string;
}