export interface TimewebMailDomain {
  id: number;
  fqdn: string;
  is_confirmed: boolean;
  linked_ip: string | null;
  mailboxes_count: number;
  created_at: string;
}

export interface TimewebMailbox {
  id: number;
  email: string;
  fqdn: string;
  auto_reply: { is_enabled: boolean; message: string } | null;
  spam_filter: string;
  forwarding: string[];
  comment: string;
  usage: number;
  quota: number;
  created_at: string;
}
