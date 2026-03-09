import { apiRequest } from "./client";
import type { TimewebProject, TimewebProjectResource } from "@/types/timeweb";

export async function listProjects(token: string): Promise<TimewebProject[]> {
  const data = await apiRequest<{ projects: TimewebProject[] }>("/projects", token);
  return data.projects ?? [];
}

export async function getProject(token: string, id: number): Promise<TimewebProject> {
  const data = await apiRequest<{ project: TimewebProject }>(`/projects/${id}`, token);
  return data.project;
}

export async function createProject(
  token: string,
  params: { name: string; description?: string }
): Promise<TimewebProject> {
  const data = await apiRequest<{ project: TimewebProject }>("/projects", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.project;
}

export async function deleteProject(token: string, id: number): Promise<null> {
  return apiRequest(`/projects/${id}`, token, { method: "DELETE" });
}

export async function listProjectResources(token: string, projectId: number): Promise<TimewebProjectResource[]> {
  const data = await apiRequest<{ resources: TimewebProjectResource[] }>(
    `/projects/${projectId}/resources`,
    token
  );
  return data.resources ?? [];
}

export async function addResourceToProject(
  token: string,
  projectId: number,
  resourceId: number,
  resourceType: string
): Promise<null> {
  return apiRequest(`/projects/${projectId}/resources`, token, {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId, resource_type: resourceType }),
  });
}

export async function removeResourceFromProject(
  token: string,
  projectId: number,
  resourceId: number,
  resourceType: string
): Promise<null> {
  return apiRequest(`/projects/${projectId}/resources`, token, {
    method: "DELETE",
    body: JSON.stringify({ resource_id: resourceId, resource_type: resourceType }),
  });
}
