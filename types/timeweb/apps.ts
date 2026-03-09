export interface TimewebApp {
  id: number;
  name: string;
  type: string;
  status: string;
  preset_id: number;
  provider: {
    type: string;
    branch: string;
    repository: string;
  };
  envs: Record<string, string>;
  domains: string[];
  framework: string;
  location: string;
  comment: string;
  created_at: string;
}

export interface TimewebAppDeploy {
  id: number;
  status: string;
  commit: string;
  comment: string;
  created_at: string;
}
