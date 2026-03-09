export interface TimewebFloatingIP {
  id: string;
  ip: string;
  is_ddos_guard: boolean;
  availability_zone: string;
  created_at: string;
  comment: string;
  ptr: string | null;
  resource_id: number | null;
  resource_type: string | null;
}
