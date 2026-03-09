export interface TimewebBucket {
  id: number;
  name: string;
  type: "private" | "public";
  object_amount: number;
  size: number;
  location: string;
  status: string;
  created_at: string;
}
