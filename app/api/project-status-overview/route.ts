// app/api/projects/route.ts
import { BASE_URL, EMAIL, JIRA_API_TOKEN } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

// Types
interface JiraProject {
  id: string;
  key: string;
  name: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    priority?: {
      name: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
    };
    created: string;
    resolutiondate?: string;
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface ProjectInfo {
  name: string;
  key: string;
  status: string;
  priority: string;
  progressPercentage: number;
  taskCount: number;
  completedTaskCount: number;
  resourcesCount: number;
  completionRatePercentage: number;
  tasksPerResource: number; // Optional, can be calculated
  completedTasksPerResource: number; // Optional, can be calculated
}

interface ApiResponse {
  success: boolean;
  data?: ProjectInfo[];
  total?: number;
  timestamp?: string;
  error?: string;
  message?: string;
}

interface ResourceUtilization {
  projectName: string;
  projectKey: string;
  tasksPerResource: number;
  completedTasksPerResource: number;
  totalTasks: number;
  totalResources: number;
  completedTasks: number;
  utilizationEfficiency: number; // percentage of tasks completed per resource
}

// Configuration
const JIRA_CONFIG = {
  baseURL: BASE_URL,
  email: EMAIL,
  apiToken: JIRA_API_TOKEN || "",
};

// Helper function to create authorization header
function getAuthHeader(): string {
  const credentials = Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`
  ).toString("base64");
  return `Basic ${credentials}`;
}

// Helper function to make Jira API requests
async function jiraFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${JIRA_CONFIG.baseURL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Jira API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// Helper function to get all issues with pagination
async function getAllIssues(projectKey: string): Promise<JiraIssue[]> {
  const allIssues: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 100; // Jira's limit
  let total = 0;

  do {
    try {
      const response = await jiraFetch<JiraSearchResponse>("/search", {
        jql: `project = "${projectKey}"`,
        fields: "status,priority,assignee,created,resolutiondate",
        startAt: startAt.toString(),
        maxResults: maxResults.toString(),
      });

      allIssues.push(...response.issues);
      total = response.total;
      startAt += maxResults;
    } catch (error) {
      break;
    }
  } while (startAt < total);

  return allIssues;
}

// Helper function to get completed task count
function getCompletedTaskCount(issues: JiraIssue[]): number {
  if (!issues || issues.length === 0) return 0;

  const completedIssues = issues.filter((issue) => {
    const category = issue.fields.status.statusCategory.key;
    return category === "done";
  });

  return completedIssues.length;
}

// Helper function to calculate progress percentage
function calculateProgress(issues: JiraIssue[]): number {
  if (!issues || issues.length === 0) return 0;

  const doneIssues = issues.filter((issue) => {
    const category = issue.fields.status.statusCategory.key;
    return category === "done";
  });

  return Math.round((doneIssues.length / issues.length) * 100);
}

// Helper function to get unique assignees (resources)
function getResourceCount(issues: JiraIssue[]): number {
  const assignees = new Set<string>();
  issues.forEach((issue) => {
    if (issue.fields.assignee?.accountId) {
      assignees.add(issue.fields.assignee.accountId);
    }
  });
  return assignees.size;
}

// Helper function to get project status (Active/Inactive)
function getProjectStatus(issues: JiraIssue[]): string {
  if (!issues || issues.length === 0) return "Inactive";

  // Check if there are any recent activities (issues created or updated in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const hasRecentActivity = issues.some((issue) => {
    const createdDate = new Date(issue.fields.created);
    const resolvedDate = issue.fields.resolutiondate
      ? new Date(issue.fields.resolutiondate)
      : null;

    // Check if issue was created recently
    if (createdDate > thirtyDaysAgo) return true;

    // Check if issue was resolved recently
    if (resolvedDate && resolvedDate > thirtyDaysAgo) return true;

    return false;
  });

  // Check if there are any issues in active status categories
  const hasActiveIssues = issues.some((issue) => {
    const category = issue.fields.status.statusCategory.key;
    const statusName = issue.fields.status.name.toLowerCase();

    // Consider issues in 'new' or 'indeterminate' categories as active
    // Also check for common active status names
    return (
      category === "new" ||
      category === "indeterminate" ||
      statusName.includes("progress") ||
      statusName.includes("review") ||
      statusName.includes("testing") ||
      statusName.includes("development")
    );
  });

  // Project is active if it has recent activity OR active issues
  return hasRecentActivity || hasActiveIssues ? "Active" : "Inactive";
}
// Helper function to get project priority (highest priority among issues)
function getProjectPriority(issues: JiraIssue[]): string {
  if (!issues || issues.length === 0) return "Unknown";

  const priorityOrder: Record<string, number> = {
    Highest: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Lowest: 1,
  };

  let highestPriority = "Lowest";
  let highestValue = 0;

  issues.forEach((issue) => {
    if (issue.fields.priority) {
      const priority = issue.fields.priority.name;
      const value = priorityOrder[priority] || 0;
      if (value > highestValue) {
        highestValue = value;
        highestPriority = priority;
      }
    }
  });

  return highestPriority;
}

// Helper function to get unique assignees count
function getUniqueResourceCount(issues: JiraIssue[]): number {
  const assignees = new Set<string>();
  issues.forEach((issue) => {
    if (issue.fields.assignee?.accountId) {
      assignees.add(issue.fields.assignee.accountId);
    }
  });
  return assignees.size;
}

// Helper function to calculate resource utilization for a project
function calculateResourceUtilization(
  project: JiraProject,
  issues: JiraIssue[]
): ResourceUtilization {
  const totalTasks = issues.length;
  const totalResources = getUniqueResourceCount(issues);
  const completedTasks = getCompletedTaskCount(issues);

  // Avoid division by zero
  const tasksPerResource =
    totalResources > 0
      ? parseFloat((totalTasks / totalResources).toFixed(1))
      : 0;
  const completedTasksPerResource =
    totalResources > 0
      ? parseFloat((completedTasks / totalResources).toFixed(1))
      : 0;
  const utilizationEfficiency =
    tasksPerResource > 0
      ? parseFloat(
          ((completedTasksPerResource / tasksPerResource) * 100).toFixed(1)
        )
      : 0;

  return {
    projectName: project.name,
    projectKey: project.key,
    tasksPerResource,
    completedTasksPerResource,
    totalTasks,
    totalResources,
    completedTasks,
    utilizationEfficiency,
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Validate environment variables
    if (!JIRA_CONFIG.baseURL || !JIRA_CONFIG.email || !JIRA_CONFIG.apiToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Jira configuration. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    // Get all projects
    const projects = await jiraFetch<JiraProject[]>("/project");

    const projectsInfo: ProjectInfo[] = await Promise.all(
      projects.map(async (project): Promise<ProjectInfo> => {
        try {
          // Get all issues for the project using pagination
          const issues = await getAllIssues(project.key);
          const completedTaskCount = getCompletedTaskCount(issues);
          const progress = calculateProgress(issues);

          const resourceUtilization = calculateResourceUtilization(
            project,
            issues
          );

          return {
            name: project.name,
            key: project.key,
            status: getProjectStatus(issues),
            priority: getProjectPriority(issues),
            progressPercentage: progress,
            taskCount: issues.length,
            completedTaskCount: completedTaskCount,
            resourcesCount: getResourceCount(issues),
            completionRatePercentage: progress,
            tasksPerResource: resourceUtilization.tasksPerResource,
            completedTasksPerResource:
              resourceUtilization.completedTasksPerResource,
          };
        } catch (error) {
          // Return project with default values if there's an error
          return {
            name: project.name,
            key: project.key,
            status: "Error",
            priority: "Unknown",
            progressPercentage: 0,
            taskCount: 0,
            resourcesCount: 0,
            completionRatePercentage: 0,
            completedTaskCount: 0,
            tasksPerResource: 0,
            completedTasksPerResource: 0,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsInfo,
      total: projectsInfo.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project information",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
