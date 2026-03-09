export interface TimewebNetworkDrive {
  id: number;
  name: string;
  comment: string;
  status: string;
  size: number;
  used: number;
  type: string;
  preset_id: number;
  linked_service: {
    id: number;
    type: string;
    name: string;
  } | null;
  location: string;
  availability_zone: string;
  created_at: string;
}
