export interface TimewebDomain {
  id: number;
  name: string;
  fqdn: string;
  is_autoprolong: boolean;
  is_premium: boolean;
  expiration: string;
  paid_till: string | null;
  days_left: number;
  provider: string;
}
