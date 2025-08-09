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
        name: string;
      };
    };
    duedate?: string;
    project: JiraProject;
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
  taskCompletionRate: ProjectMetrics | null; // Optional, can be calculated
  healthScore: number; // Optional, can be calculated
  timeline: ProjectTimelineData | null; // Optional, can be calculated
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

interface ProjectMetric {
  projectName: string;
  completionTimes: number[];
  totalTasks: number;
  delayedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}

interface ProjectMetrics {
  /** Total number of issues in the project */
  totalTasks: number;

  /** Issues marked as "Done" status category */
  completedTasks: number;

  /** Issues that missed their due date */
  delayedTasks: number;

  /** Issues currently "In Progress" status category */
  inProgressTasks: number;

  /** Average days to complete tasks (rounded to 1 decimal place) */
  avgCompletionTime: number;

  /** Percentage of completed tasks (rounded to nearest integer) */
  completionRate: number;

  /** Array of individual completion times in days */
  completionTimes: number[];
}

interface ProjectHealthData {
  projectName: string;
  projectKey: string;
  healthScore: number;
  healthStatus: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  statusColor: "green" | "blue" | "yellow" | "orange" | "red";
  breakdown: {
    completionScore: number;
    timelinessScore: number;
    velocityScore: number;
    qualityScore: number;
  };
  recommendations: string[];
}

interface ProjectTimelineData {
  projectName: string;
  projectKey: string;
  startDate: string;
  endDate: string;
  priority: "High" | "Medium" | "Low";
  timeProgress: number;
  taskProgress: number;
  scheduleStatus: "On Track" | "Behind Schedule" | "Ahead of Schedule";
  resourcesAssigned: number;
  totalTasks: number;
  completedTasks: number;
  projectDuration: number; // in days
  remainingDays: number;
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

class ProjectHealthCalculator {
  private defaultWeights = {
    completion: 0.35,
    timeliness: 0.3,
    velocity: 0.2,
    quality: 0.15,
  };

  calculateHealthScore(metrics: ProjectMetrics): {
    overallScore: number;
    breakdown: ProjectHealthData["breakdown"];
  } {
    const breakdown = {
      completionScore: this.calculateCompletionScore(metrics),
      timelinessScore: this.calculateTimelinessScore(metrics),
      velocityScore: this.calculateVelocityScore(metrics),
      qualityScore: this.calculateQualityScore(metrics),
    };

    const overallScore = Math.round(
      breakdown.completionScore * this.defaultWeights.completion +
        breakdown.timelinessScore * this.defaultWeights.timeliness +
        breakdown.velocityScore * this.defaultWeights.velocity +
        breakdown.qualityScore * this.defaultWeights.quality
    );

    return { overallScore, breakdown };
  }

  private calculateCompletionScore(metrics: ProjectMetrics): number {
    return metrics.totalTasks === 0 ? 0 : Math.min(metrics.completionRate, 100);
  }

  private calculateTimelinessScore(metrics: ProjectMetrics): number {
    if (metrics.totalTasks === 0) return 100;

    const delayRate = (metrics.delayedTasks / metrics.totalTasks) * 100;

    if (delayRate === 0) return 100;
    if (delayRate <= 5) return 90;
    if (delayRate <= 10) return 80;
    if (delayRate <= 20) return 60;
    if (delayRate <= 30) return 40;
    if (delayRate <= 50) return 20;
    return 10;
  }

  private calculateVelocityScore(metrics: ProjectMetrics): number {
    if (metrics.completionTimes.length === 0) return 50;

    const avgTime = metrics.avgCompletionTime;

    if (avgTime <= 3) return 100;
    if (avgTime <= 7) return 90;
    if (avgTime <= 14) return 80;
    if (avgTime <= 21) return 60;
    if (avgTime <= 30) return 40;
    if (avgTime <= 45) return 20;
    return 10;
  }

  private calculateQualityScore(metrics: ProjectMetrics): number {
    if (metrics.completionTimes.length <= 1) return 50;

    const times = metrics.completionTimes;
    const mean = metrics.avgCompletionTime;
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
      times.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

    if (coefficientOfVariation <= 20) return 100;
    if (coefficientOfVariation <= 40) return 80;
    if (coefficientOfVariation <= 60) return 60;
    if (coefficientOfVariation <= 80) return 40;
    if (coefficientOfVariation <= 100) return 20;
    return 10;
  }
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
        fields:
          "status,priority,assignee,created,resolutiondate,duedate,project",
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

function fetchComprehensiveTaskData(issues: JiraIssue[]) {
  // Initialize metrics for the single project
  let totalTasks = 0;
  let completedTasks = 0;
  let delayedTasks = 0;
  let inProgressTasks = 0;
  const completionTimes: number[] = [];

  const now = new Date();

  issues.forEach((issue: JiraIssue) => {
    const status = issue.fields.status.name;
    const statusCategory = issue.fields.status.statusCategory.name;
    const created = new Date(issue.fields.created);
    const resolved = issue.fields.resolutiondate
      ? new Date(issue.fields.resolutiondate)
      : null;
    const dueDate = issue.fields.duedate
      ? new Date(issue.fields.duedate)
      : null;

    totalTasks++;

    // For completed tasks
    if (statusCategory === "Done" && resolved) {
      completedTasks++;
      const completionTime =
        (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      completionTimes.push(completionTime);

      // Check if it was delayed
      if (dueDate && resolved.getTime() > dueDate.getTime()) {
        delayedTasks++;
      }
    }

    // For in-progress tasks, check if they're currently delayed
    if (statusCategory === "In Progress") {
      inProgressTasks++;
      if (dueDate && now.getTime() > dueDate.getTime()) {
        delayedTasks++;
      }
    }

    // For other statuses (To Do, etc.), check if they're overdue
    if (statusCategory !== "Done" && statusCategory !== "In Progress") {
      if (dueDate && now.getTime() > dueDate.getTime()) {
        delayedTasks++;
      }
    }
  });

  // Calculate final metrics
  const avgCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return {
    totalTasks,
    completedTasks,
    delayedTasks,
    inProgressTasks,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    completionRate: Math.round(completionRate),
    completionTimes,
  };
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

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateTimelineData(
  project: JiraProject,
  issues: JiraIssue[]
): ProjectTimelineData {
  const now = new Date();

  // Get project dates from issues
  const createdDates = issues.map((issue) => new Date(issue.fields.created));
  const dueDates = issues
    .filter((issue) => issue.fields.duedate)
    .map((issue) => new Date(issue.fields.duedate!));

  // Determine project start and end dates
  const startDate =
    createdDates.length > 0
      ? new Date(Math.min(...createdDates.map((d) => d.getTime())))
      : now;

  const endDate =
    dueDates.length > 0
      ? new Date(Math.max(...dueDates.map((d) => d.getTime())))
      : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days from now

  // Calculate time progress
  const totalProjectDays = Math.max(
    1,
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const elapsedDays = Math.max(
    0,
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeProgress = Math.min(
    100,
    Math.max(0, Math.round((elapsedDays / totalProjectDays) * 100))
  );

  // Calculate task progress
  const totalTasks = issues.length;
  const completedTasks = issues.filter(
    (issue) => issue.fields.status.statusCategory.key === "done"
  ).length;
  const taskProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine schedule status
  let scheduleStatus: ProjectTimelineData["scheduleStatus"] = "On Track";
  if (timeProgress > taskProgress + 10) {
    scheduleStatus = "Behind Schedule";
  } else if (taskProgress > timeProgress + 15) {
    scheduleStatus = "Ahead of Schedule";
  }

  // Get project priority (highest priority among issues)
  const priorities = issues
    .filter((issue) => issue.fields.priority)
    .map((issue) => issue.fields.priority!.name);

  const priorityOrder: Record<string, number> = {
    Highest: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Lowest: 1,
  };

  let projectPriority: ProjectTimelineData["priority"] = "Medium";
  let highestPriorityValue = 0;

  priorities.forEach((priority) => {
    const value = priorityOrder[priority] || 3;
    if (value > highestPriorityValue) {
      highestPriorityValue = value;
      if (value >= 4) projectPriority = "High";
      else if (value === 3) projectPriority = "Medium";
      else projectPriority = "Low";
    }
  });

  // Count unique resources
  const uniqueAssignees = new Set(
    issues
      .filter((issue) => issue.fields.assignee?.accountId)
      .map((issue) => issue.fields.assignee!.accountId)
  );

  const remainingDays = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    projectName: project.name,
    projectKey: project.key,
    startDate: startDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
    endDate: endDate.toISOString().split("T")[0],
    priority: projectPriority,
    timeProgress,
    taskProgress,
    scheduleStatus,
    resourcesAssigned: uniqueAssignees.size,
    totalTasks,
    completedTasks,
    projectDuration: Math.round(totalProjectDays),
    remainingDays,
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
    const healthCalculator = new ProjectHealthCalculator();
    const projectsInfo: ProjectInfo[] = await Promise.all(
      projects.map(async (project): Promise<ProjectInfo> => {
        try {
          // Get all issues for the project using pagination
          const issues = await getAllIssues(project.key);
          const completedTaskCount = getCompletedTaskCount(issues);
          const progress = calculateProgress(issues);
          const taskCompletionRate = fetchComprehensiveTaskData(issues);
          const { overallScore } =
            healthCalculator.calculateHealthScore(taskCompletionRate);

          const resourceUtilization = calculateResourceUtilization(
            project,
            issues
          );

          const timeline = calculateTimelineData(project, issues);

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
            taskCompletionRate: taskCompletionRate,
            healthScore: overallScore,
            timeline: {
              ...timeline,
              startDate: formatDateForDisplay(timeline.startDate),
              endDate: formatDateForDisplay(timeline.endDate),
            },
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
            taskCompletionRate: null,
            healthScore: 0,
            timeline: null,
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
