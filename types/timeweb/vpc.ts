export interface TimewebVPC {
  id: string;
  name: string;
  subnet_v4: string;
  location: string;
  availability_zone: string;
  description: string;
  created_at: string;
  services: TimewebVPCService[];
}

export interface TimewebVPCService {
  id: number;
  name: string;
  type: string;
  local_ip: string;
}
