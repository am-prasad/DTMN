/**
 * Centralized API client.
 * All backend communication goes through this module.
 * API URL is read from environment variables — never hardcoded.
 */

const API_BASE =
  typeof window !== "undefined"
    ? "/api/v1"
    : `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/v1`;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
  revalidate?: number;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}, _retried = false): Promise<T> {
  const { method = "GET", body, headers = {}, cache, tags, revalidate } = options;

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(cache && { cache }),
    ...(tags || revalidate !== undefined
      ? { next: { ...(tags && { tags }), ...(revalidate !== undefined && { revalidate }) } }
      : {}),
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  // C4: On 401, attempt a silent token refresh then retry the original request.
  // Auth endpoints are excluded to avoid infinite loops.
  if (res.status === 401 && !_retried && !path.startsWith("/auth/")) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      // Retry the original request with the new access token cookie
      return request<T>(path, options, true);
    }
    // Refresh failed — session is dead; redirect to login (client side only)
    if (typeof window !== "undefined") {
      window.location.href = `/admin/login?from=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail || detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return undefined as T;
}



// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const api = {
  // Events
  events: {
    list: (params?: { upcoming?: boolean; past?: boolean; page?: number; page_size?: number }) => {
      const q = new URLSearchParams();
      if (params?.upcoming) q.set("upcoming", "true");
      if (params?.past) q.set("past", "true");
      if (params?.page) q.set("page", String(params.page));
      if (params?.page_size) q.set("page_size", String(params.page_size));
      return request<import("@/types").EventListItem[]>(`/events?${q}`, { revalidate: 60 });
    },
    get: (slug: string) => request<import("@/types").Event>(`/events/${slug}`, { revalidate: 60 }),
  },

  // Circulars
  circulars: {
    list: (params?: { category?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.search) q.set("search", params.search);
      if (params?.page) q.set("page", String(params.page));
      return request<import("@/types").Circular[]>(`/circulars?${q}`, { revalidate: 60 });
    },
    get: (slug: string) => request<import("@/types").Circular>(`/circulars/${slug}`, { revalidate: 60 }),
    downloadUrl: (id: number) => `${API_BASE}/circulars/${id}/download`,
  },

  // Activities
  activities: {
    list: (params?: { category?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.page) q.set("page", String(params.page));
      return request<import("@/types").Activity[]>(`/activities?${q}`, { revalidate: 60 });
    },
    get: (slug: string) => request<import("@/types").Activity>(`/activities/${slug}`, { revalidate: 60 }),
  },

  // Faculty
  faculty: {
    list: (params?: { section?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.section) q.set("section", params.section);
      if (params?.page) q.set("page", String(params.page));
      return request<import("@/types").FacultyMember[]>(`/faculty?${q}`, { revalidate: 120 });
    },
  },

  // Gallery
  gallery: {
    listAlbums: (params?: { category?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.page) q.set("page", String(params.page));
      return request<import("@/types").GalleryAlbumListItem[]>(`/gallery?${q}`, { revalidate: 120 });
    },
    getAlbum: (slug: string) => request<import("@/types").GalleryAlbum>(`/gallery/${slug}`, { revalidate: 120 }),
  },

  // Facilities
  facilities: {
    list: () => request<import("@/types").Facility[]>("/facilities", { revalidate: 300 }),
  },

  // Academic Sections
  sections: {
    list: () => request<import("@/types").AcademicSection[]>("/academic-sections", { revalidate: 300 }),
    get: (slug: string) => request<import("@/types").AcademicSection>(`/academic-sections/${slug}`, { revalidate: 300 }),
  },

  // Admissions
  admissions: {
    getInfo: (slug: string) => request<import("@/types").AdmissionInfo>(`/admissions/${slug}`, { revalidate: 300 }),
    submitEnquiry: (data: import("@/types").AdmissionEnquiryForm) =>
      request("/admissions/enquiry", { method: "POST", body: data }),
  },

  // Site Content
  content: {
    list: (group?: string) => {
      const q = group ? `?group=${group}` : "";
      return request<import("@/types").SiteContent[]>(`/content${q}`, { revalidate: 300 });
    },
    get: (key: string) => request<import("@/types").SiteContent>(`/content/${key}`, { revalidate: 300 }),
  },

  // Contact
  contact: {
    submit: (data: import("@/types").ContactForm) =>
      request("/contact", { method: "POST", body: data }),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      request("/auth/login", { method: "POST", body: { email, password } }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request<import("@/types").AdminUser>("/auth/me"),
    refresh: () => request("/auth/refresh", { method: "POST" }),
    // C1: Complete the MFA flow — call after login returns requires_mfa=true
    verifyMfa: (code: string) =>
      request("/auth/mfa/verify", { method: "POST", body: { code } }),
    // C1: Allow login via one-time recovery code when TOTP is unavailable
    recoverMfa: (recovery_code: string) =>
      request("/auth/mfa/recover", { method: "POST", body: { recovery_code } }),
    changePassword: (current_password: string, new_password: string) =>
      request("/auth/password/change", { method: "POST", body: { current_password, new_password } }),
  },


  // Admin
  admin: {
    stats: () => request<import("@/types").AdminStats>("/admin/stats"),

    // Events
    listEvents: (page = 1) => request<import("@/types").EventListItem[]>(`/admin/events?page=${page}`),
    createEvent: (data: unknown) => request("/admin/events", { method: "POST", body: data }),
    updateEvent: (id: number, data: unknown) => request(`/admin/events/${id}`, { method: "PATCH", body: data }),
    deleteEvent: (id: number) => request(`/admin/events/${id}`, { method: "DELETE" }),

    // Circulars
    listCirculars: (page = 1) => request<import("@/types").Circular[]>(`/admin/circulars?page=${page}`),
    createCircular: (data: unknown) => request("/admin/circulars", { method: "POST", body: data }),
    updateCircular: (id: number, data: unknown) => request(`/admin/circulars/${id}`, { method: "PATCH", body: data }),
    deleteCircular: (id: number) => request(`/admin/circulars/${id}`, { method: "DELETE" }),

    // Activities
    listActivities: (page = 1) => request<import("@/types").Activity[]>(`/admin/activities?page=${page}`),
    createActivity: (data: unknown) => request("/admin/activities", { method: "POST", body: data }),
    updateActivity: (id: number, data: unknown) => request(`/admin/activities/${id}`, { method: "PATCH", body: data }),
    deleteActivity: (id: number) => request(`/admin/activities/${id}`, { method: "DELETE" }),

    // Faculty
    listFaculty: (page = 1) => request<import("@/types").FacultyMember[]>(`/admin/faculty?page=${page}`),
    createFaculty: (data: unknown) => request("/admin/faculty", { method: "POST", body: data }),
    updateFaculty: (id: number, data: unknown) => request(`/admin/faculty/${id}`, { method: "PATCH", body: data }),
    deleteFaculty: (id: number) => request(`/admin/faculty/${id}`, { method: "DELETE" }),

    // Gallery
    listAlbums: () => request<import("@/types").GalleryAlbumListItem[]>("/admin/gallery"),
    getAlbum: (id: number) => request<import("@/types").GalleryAlbum>(`/admin/gallery/${id}`),
    createAlbum: (data: unknown) => request("/admin/gallery", { method: "POST", body: data }),
    updateAlbum: (id: number, data: unknown) => request(`/admin/gallery/${id}`, { method: "PATCH", body: data }),
    deleteAlbum: (id: number) => request(`/admin/gallery/${id}`, { method: "DELETE" }),
    uploadAlbumImage: async (albumId: number, file: File, caption?: string) => {
      const form = new FormData();
      form.append("file", file);
      if (caption) form.append("caption", caption);
      const res = await fetch(`${API_BASE}/admin/gallery/${albumId}/images`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, "Image upload failed");
      return res.json();
    },
    deleteAlbumImage: (imageId: number) => request(`/admin/gallery/images/${imageId}`, { method: "DELETE" }),

    // Facilities
    listFacilities: () => request<import("@/types").Facility[]>("/admin/facilities"),
    createFacility: (data: unknown) => request("/admin/facilities", { method: "POST", body: data }),
    updateFacility: (id: number, data: unknown) => request(`/admin/facilities/${id}`, { method: "PATCH", body: data }),
    deleteFacility: (id: number) => request(`/admin/facilities/${id}`, { method: "DELETE" }),

    // Academic Sections
    updateSection: (slug: string, data: unknown) =>
      request(`/admin/academic-sections/${slug}`, { method: "PATCH", body: data }),

    // Admissions
    updateAdmissionInfo: (slug: string, data: unknown) =>
      request(`/admin/admissions/${slug}`, { method: "PATCH", body: data }),
    listEnquiries: (page = 1) =>
      request<import("@/types").AdmissionEnquiry[]>(`/admin/admissions/enquiries?page=${page}`),
    updateEnquiry: (id: number, data: { status?: string; notes?: string }) =>
      request<import("@/types").AdmissionEnquiry>(`/admin/admissions/enquiries/${id}`, { method: "PATCH", body: data }),

    // Contact Submissions
    listContactSubmissions: (page = 1, is_read?: boolean) =>
      request<import("@/types").ContactSubmission[]>(
        `/admin/contact-submissions?page=${page}${is_read !== undefined ? `&is_read=${is_read}` : ""}`
      ),
    updateContactSubmission: (id: number, data: { is_read?: boolean }) =>
      request<import("@/types").ContactSubmission>(`/admin/contact-submissions/${id}`, { method: "PATCH", body: data }),
    deleteContactSubmission: (id: number) =>
      request(`/admin/contact-submissions/${id}`, { method: "DELETE" }),

    // Categories and Departments
    listEventCategories: () => request<import("@/types").EventCategory[]>("/event-categories"),
    createEventCategory: (data: { name: string }) =>
      request<import("@/types").EventCategory>("/admin/event-categories", { method: "POST", body: data }),
    deleteEventCategory: (id: number) => request(`/admin/event-categories/${id}`, { method: "DELETE" }),

    listActivityCategories: () => request<import("@/types").ActivityCategory[]>("/activity-categories"),
    createActivityCategory: (data: { name: string }) =>
      request<import("@/types").ActivityCategory>("/admin/activity-categories", { method: "POST", body: data }),
    deleteActivityCategory: (id: number) => request(`/admin/activity-categories/${id}`, { method: "DELETE" }),

    listDepartments: (section?: string) =>
      request<import("@/types").Department[]>(`/departments${section ? `?section=${section}` : ""}`),
    createDepartment: (data: { name: string; section: string }) =>
      request<import("@/types").Department>("/admin/departments", { method: "POST", body: data }),
    deleteDepartment: (id: number) => request(`/admin/departments/${id}`, { method: "DELETE" }),

    // Content
    updateContent: (key: string, value: string) =>
      request(`/admin/content/${key}`, { method: "PATCH", body: { value } }),

    // Users
    listUsers: () => request<import("@/types").AdminUser[]>("/admin/users"),
    createUser: (data: unknown) => request("/admin/users", { method: "POST", body: data }),
    updateUser: (id: number, data: unknown) => request(`/admin/users/${id}`, { method: "PATCH", body: data }),

    // Audit logs
    auditLogs: (page = 1) => request<import("@/types").AuditLog[]>(`/admin/audit-logs?page=${page}`),
  },

  // File upload
  upload: {
    image: async (file: File, subdir = "images") => {
      const form = new FormData();
      form.append("file", file);
      form.append("subdir", subdir);
      const res = await fetch(`${API_BASE}/admin/uploads/image`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, "Upload failed");
      return res.json() as Promise<{ path: string; url: string }>;
    },
    document: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/admin/uploads/document`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, "Upload failed");
      return res.json() as Promise<{ path: string; filename: string; url: string }>;
    },
  },
};

export { ApiError };

// ---------------------------------------------------------------------------
// Utility: build image / media URL from stored relative path
// ---------------------------------------------------------------------------
export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.replace(/^\/?(uploads\/)?/, "");
  return `/uploads/${clean}`;
}

export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return mediaUrl(path);
}
