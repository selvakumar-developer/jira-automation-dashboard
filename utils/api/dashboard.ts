import { ProjectInfo } from "@/app/api/project-status-overview/route";

export async function getOverviewData() {
  return fetch("/api/project-overview").then((res) => res.json());
}

interface ProjectStatusOverview {
  success: boolean;
  data: ProjectInfo[];
  total: number;
  timestamp: string;
}
export async function getOverviewStatusTableData(): Promise<ProjectStatusOverview> {
  return fetch("/api/project-status-overview").then((res) => res.json());
}
