export interface TimewebProject {
  id: number;
  name: string;
  description: string;
  avatar_id: string | null;
  is_default: boolean;
  created_at: string;
}

export interface TimewebProjectResource {
  id: number;
  type: string;
  name: string;
  status: string;
}
