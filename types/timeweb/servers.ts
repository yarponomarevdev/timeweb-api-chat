export interface TimewebIP {
  ip: string;
  is_main: boolean;
  type: "ipv4" | "ipv6";
  ptr: string | null;
}

export interface TimewebDisk {
  id: number;
  size: number;
  used: number;
  type: string;
  system: boolean;
  status: string;
}

export interface TimewebOS {
  id: number;
  name: string;
  version: string;
  family: "linux" | "windows" | "freebsd";
  requirements?: {
    min_disk?: number;
    min_ram?: number;
  };
}

export interface TimewebPreset {
  id: number;
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
  description: string;
  description_short: string;
  price: number;
  location: string;
  disk_type: string;
  cpu_frequency: string;
}

export interface TimewebServer {
  id: number;
  name: string;
  comment: string;
  status:
    | "on"
    | "off"
    | "installing"
    | "removing"
    | "rebooting"
    | "starting"
    | "stopping"
    | "resetting_password"
    | "reinstalling"
    | "backup_creating"
    | "backup_restoring"
    | "cloning"
    | "migrating"
    | "no_paid";
  os: TimewebOS;
  preset_id: number | null;
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
  created_at: string;
  availability_zone: string;
  location: string;
  networks: Array<{
    type: string;
    ips: TimewebIP[];
  }>;
  disks: TimewebDisk[];
  image: {
    id: string;
    name: string;
  } | null;
  software: {
    id: number;
    name: string;
  } | null;
}

export interface TimewebFinances {
  balance: number;
  currency: string;
  discount_end_date_at: string | null;
  discount_percent: number;
  hours_left: number | null;
  is_blocked: boolean;
  is_permanent_blocked: boolean;
  is_send_closing_documents: boolean;
  is_store_data_after_deleted: boolean;
  one_time_charges: number;
  penalty: number;
  promocode_balance: number;
  total: number;
}

export interface TimewebCreateServerParams {
  name: string;
  os_id?: number;
  preset_id?: number;
  bandwidth?: number;
  comment?: string;
  ssh_keys_ids?: number[];
  is_ddos_guard?: boolean;
  availability_zone?: string;
  configuration?: {
    configurator_id: number;
    disk: number;
    cpu: number;
    ram: number;
  };
}

export type ServerAction = "start" | "shutdown" | "reboot" | "hard-reboot" | "reset_password" | "reinstall";

export interface TimewebServerStats {
  cpu_load: Array<{ x: string; y: number }>;
  network_traffic: Array<{ x: string; y_in: number; y_out: number }>;
  disk: Array<{ x: string; y: number }>;
  ram: Array<{ x: string; y: number }>;
}
