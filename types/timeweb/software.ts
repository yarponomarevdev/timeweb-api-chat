export interface TimewebSoftware {
  id: number;
  name: string;
  os?: {
    id?: number;
    name?: string;
    version?: string;
  } | null;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  install_time?: number | null;
  requirements?: {
    min_disk?: number;
    min_ram?: number;
  } | null;
}
