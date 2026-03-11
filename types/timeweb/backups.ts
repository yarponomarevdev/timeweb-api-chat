export interface TimewebBackup {
  id: number;
  name: string;
  status: string;
  size: number;
  created_at: string;
  comment: string;
  type: string;
  progress: number;
  disk_id: number;
  completion_at: string | null;
}
