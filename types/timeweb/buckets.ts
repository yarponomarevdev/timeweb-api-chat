export interface TimewebBucket {
  id: number;
  name: string;
  type: "private" | "public";
  object_amount: number;
  size: number;
  location: string;
  status: string;
  created_at: string;
  hostname?: string;
  access_key?: string;
  secret_key?: string;
}
