export interface TimewebImage {
  id: string;
  name: string;
  description: string;
  status: string;
  size: number;
  os: string | null;
  disk_id: number | null;
  location: string;
  created_at: string;
  progress: number;
}

export interface TimewebImageDownloadURL {
  id: string;
  url: string;
  type: string;
  created_at: string;
}
