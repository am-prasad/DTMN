/**
 * Shared TypeScript types for the institution website.
 * These mirror the backend Pydantic response schemas.
 */

export interface EventCategory {
  id: number;
  name: string;
  slug: string;
}

export interface EventImage {
  id: number;
  image_path: string;
  caption?: string;
  sort_order: number;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  event_date: string; // ISO date
  start_time?: string;
  end_time?: string;
  venue?: string;
  cover_image?: string;
  registration_url?: string;
  is_published: boolean;
  is_archived: boolean;
  category?: EventCategory;
  images: EventImage[];
}

export interface EventListItem {
  id: number;
  title: string;
  slug: string;
  event_date: string;
  start_time?: string;
  venue?: string;
  cover_image?: string;
  is_published: boolean;
  category?: EventCategory;
}

// ---------------------------------------------------------------------------

export interface Circular {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category: string;
  attachment_path?: string;
  attachment_filename?: string;
  published_at?: string;
  expires_at?: string;
  is_published: boolean;
  is_archived: boolean;
}

// ---------------------------------------------------------------------------

export interface ActivityCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ActivityImage {
  id: number;
  image_path: string;
  caption?: string;
  sort_order: number;
}

export interface Activity {
  id: number;
  title: string;
  slug: string;
  description?: string;
  activity_date?: string;
  video_url?: string;
  is_published: boolean;
  is_archived: boolean;
  category?: ActivityCategory;
  images: ActivityImage[];
}

// ---------------------------------------------------------------------------

export interface Department {
  id: number;
  name: string;
  section: string;
}

export interface FacultyMember {
  id: number;
  name: string;
  designation: string;
  qualification?: string;
  experience_years?: number;
  bio?: string;
  photo?: string;
  institutional_email?: string;
  is_active: boolean;
  section: string;
  sort_order: number;
  department?: Department;
}

// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: number;
  image_path: string;
  caption?: string;
  sort_order: number;
}

export interface GalleryAlbum {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  cover_image?: string;
  is_published: boolean;
  images: GalleryImage[];
}

export interface GalleryAlbumListItem {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  cover_image?: string;
  is_published: boolean;
  image_count: number;
}

// ---------------------------------------------------------------------------

export interface Facility {
  id: number;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------

export interface AcademicSection {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  programs?: string;
  curriculum?: string;
  achievements?: string;
  head_name?: string;
  head_designation?: string;
  head_message?: string;
  head_photo?: string;
  cover_image?: string;
}

// ---------------------------------------------------------------------------

export interface AdmissionInfo {
  id: number;
  section_slug: string;
  overview?: string;
  eligibility?: string;
  process?: string;
  important_dates?: string;
  documents_required?: string;
  fee_info?: string;
  faqs?: string;
  contact_info?: string;
}

export interface AdmissionEnquiryForm {
  student_name: string;
  parent_name: string;
  email: string;
  phone: string;
  section: string;
  message?: string;
}

export interface AdmissionEnquiry {
  id: number;
  student_name: string;
  parent_name: string;
  email: string;
  phone: string;
  section: string;
  message?: string;
  status: string;
  notes?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------

export interface SiteContent {
  key: string;
  value?: string;
  content_type: string;
  label?: string;
  group?: string;
}

// ---------------------------------------------------------------------------

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  mfa_enabled: boolean;
}

export interface AdminStats {
  total_events: number;
  upcoming_events: number;
  published_circulars: number;
  total_activities: number;
  total_faculty: number;
  gallery_albums: number;
  admission_enquiries: number;
  events?: { total: number; drafts: number; upcoming: number; past: number };
  circulars?: { published: number; drafts: number; expiring_7d: number };
  activities?: { published: number; drafts: number };
  faculty?: { active: number; inactive: number };
  gallery?: { published: number; empty_albums: number };
  enquiries?: { new: number; total: number };
  contact?: { unread: number };
  attention?: { type: string; resource: string; id: number; label: string }[];
  recent?: { action: string; user: string; resource: string; at: string }[];
}

export interface AuditLog {
  id: number;
  user_email?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  result: string;
  created_at: string;
}
