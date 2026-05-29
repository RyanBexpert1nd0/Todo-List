export interface User {
  id: string
  clerk_id: string
  email: string
  name: string
  avatar_url?: string
}

export interface Organization {
  id: string
  clerk_org_id: string
  name: string
  slug: string
}

export interface Category {
  id: string
  organization_id: string
  name: string
  color: string
  tasks_count?: number
}

export interface Task {
  id: string
  organization_id: string
  created_by: string
  assigned_to?: string
  parent_task_id?: string
  category_id?: string
  title: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in_progress" | "done"
  deadline_at?: string
  sort_order: number
  recurrence_type: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrence_rule?: string
  completed_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
  creator?: User
  assignee?: User
  category?: Category
  comments?: Comment[]
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  task_id?: string
  type: "deadline_reminder" | "assigned" | "comment"
  body: string
  read_at?: string
  created_at: string
  task?: Task
}

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  my_tasks: number
  completion_rate: number
}

export interface WeeklyProgress {
  date: string
  completed: number
  created: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
