export interface TimewebSSHKey {
  id: number;
  name: string;
  body: string;
  created_at: string;
  used_at: string | null;
  fingerprint: string;
}
