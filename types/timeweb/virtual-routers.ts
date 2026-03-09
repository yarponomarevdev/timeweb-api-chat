export interface TimewebVirtualRouter {
  id: number;
  name: string;
  status?: string;
  location?: string;
  availability_zone?: string;
  description?: string;
  created_at?: string;
  public_ip?: string | null;
}
