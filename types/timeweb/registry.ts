export interface TimewebRegistry {
  id: number;
  name: string;
  status: string;
  location: string;
  created_at: string;
  login: string;
  password: string;
  endpoint: string;
  repositories: TimewebRegistryRepository[];
}

export interface TimewebRegistryRepository {
  name: string;
  tags_count: number;
  size: number;
}
