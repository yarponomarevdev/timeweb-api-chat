export interface TimewebDatabase {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  disk: number;
  comment: string;
  preset_id: number;
  location: string;
  host?: string;
  port?: number;
  login?: string;
  password?: string;
  ip?: string;
  external_hostname?: string;
}
