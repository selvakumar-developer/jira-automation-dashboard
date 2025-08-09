"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

import { ProjectInfo } from "@/app/api/project-status-overview/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getOverviewData,
  getOverviewStatusTableData,
} from "@/utils/api/dashboard";
import { useQuery } from "@tanstack/react-query";

// Mock data for projects
const projectsData = [
  {
    id: 1,
    name: "E-commerce Platform",
    status: "Active",
    totalTasks: 45,
    inProgress: 12,
    pending: 8,
    completed: 20,
    blocked: 3,
    testing: 2,
    resources: 8,
    avgCompletionTime: 4.2,
    delayedTasks: 5,
    onTimeCompletion: 85,
    budget: 150000,
    budgetUsed: 89000,
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    priority: "High",
  },
  {
    id: 2,
    name: "Mobile App Development",
    status: "Active",
    totalTasks: 32,
    inProgress: 8,
    pending: 5,
    completed: 15,
    blocked: 2,
    testing: 2,
    resources: 6,
    avgCompletionTime: 3.8,
    delayedTasks: 3,
    onTimeCompletion: 78,
    budget: 120000,
    budgetUsed: 65000,
    startDate: "2024-02-01",
    endDate: "2024-07-15",
    priority: "High",
  },
  {
    id: 3,
    name: "Data Analytics Dashboard",
    status: "Planning",
    totalTasks: 28,
    inProgress: 6,
    pending: 12,
    completed: 8,
    blocked: 1,
    testing: 1,
    resources: 4,
    avgCompletionTime: 5.1,
    delayedTasks: 2,
    onTimeCompletion: 92,
    budget: 80000,
    budgetUsed: 25000,
    startDate: "2024-03-01",
    endDate: "2024-08-30",
    priority: "Medium",
  },
  {
    id: 4,
    name: "Customer Portal",
    status: "Active",
    totalTasks: 38,
    inProgress: 10,
    pending: 6,
    completed: 18,
    blocked: 2,
    testing: 2,
    resources: 5,
    avgCompletionTime: 3.5,
    delayedTasks: 4,
    onTimeCompletion: 88,
    budget: 95000,
    budgetUsed: 72000,
    startDate: "2024-01-20",
    endDate: "2024-05-30",
    priority: "Medium",
  },
  {
    id: 5,
    name: "API Integration",
    status: "Completed",
    totalTasks: 22,
    inProgress: 0,
    pending: 0,
    completed: 20,
    blocked: 0,
    testing: 2,
    resources: 3,
    avgCompletionTime: 2.8,
    delayedTasks: 1,
    onTimeCompletion: 95,
    budget: 45000,
    budgetUsed: 43000,
    startDate: "2023-11-01",
    endDate: "2024-02-15",
    priority: "Low",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-500";
    case "Planning":
      return "bg-yellow-500";
    case "Completed":
      return "bg-blue-500";
    case "On Hold":
      return "bg-gray-500";
    case "Inactive":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Highest":
      return "destructive";
    case "Medium":
      return "default";
    case "Low":
      return "secondary";
    default:
      return "default";
  }
};

export default function JiraDashboard() {
  const [timeRange, setTimeRange] = useState<string>("30d");

  const {
    data: overviewData,
    isLoading: overviewDataLoading,
    refetch: refetchOverviewData,
    isRefetching: isRefetchingOverviewData,
  } = useQuery({
    queryKey: ["overview"],
    queryFn: () => getOverviewData(),
    refetchOnWindowFocus: false,
  });

  const {
    data: overviewStatusTableData,
    isLoading: overviewStatusTableDataLoading,
    refetch: refetchOverviewStatusTableData,
    isRefetching: isRefetchingOverviewStatusTableData,
  } = useQuery({
    queryKey: ["overview-status-table"],
    queryFn: () => getOverviewStatusTableData(),
    refetchOnWindowFocus: false,
  });

  function handleRefreshDashboardClick() {
    refetchOverviewData();
    refetchOverviewStatusTableData();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Project Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive overview of all projects and their performance
              metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            {/* <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button> */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshDashboardClick}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Overview Cards */}

        {overviewDataLoading || isRefetchingOverviewData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-[150px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData.totalProjects}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overviewData.totalProjects} active projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData.totalIssues}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (overviewData.globalTaskCounts.done /
                      overviewData.totalIssues) *
                    100
                  ).toFixed(2)}
                  % completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Resources
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData.totalResources}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all projects
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Status Overview */}
        {overviewDataLoading || isRefetchingOverviewData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="h-[125px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {overviewData.globalTaskCounts.done}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-500" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {overviewData.globalTaskCounts.inProgress}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PauseCircle className="h-4 w-4 text-yellow-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {overviewData.globalTaskCounts.todo}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {overviewData.globalTaskCounts.blocked}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {overviewData.globalTaskCounts.testing}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Project Overview</TabsTrigger>
            <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>
                  Detailed breakdown of all projects and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overviewStatusTableDataLoading ||
                isRefetchingOverviewStatusTableData ? (
                  <Skeleton className="h-[400px] w-full rounded-lg" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overviewStatusTableData?.data.map(
                        (project: ProjectInfo) => (
                          <TableRow key={project.key}>
                            <TableCell className="font-medium">
                              {project.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(project.status)}
                              >
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getPriorityColor(project.priority)}
                              >
                                {project.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Progress
                                  value={project.progressPercentage}
                                  className="w-20"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {project.progressPercentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{project.taskCount} total</div>
                                <div className="text-muted-foreground">
                                  {project.completedTaskCount} completed
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{project.resourcesCount}</TableCell>
                            <TableCell>
                              {/* <div className="flex items-center gap-1">
                                {project.onTimeCompletion >= 90 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                {project.onTimeCompletion}%
                              </div> */}
                              {project.progressPercentage}%
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Distribution</CardTitle>
                  <CardDescription>
                    Number of resources allocated per project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overviewStatusTableData?.data.map((project) => (
                      <div
                        key={project.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {project.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {project.resourcesCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>
                    Resource efficiency across projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overviewStatusTableDataLoading ||
                    isRefetchingOverviewStatusTableData ? (
                      <Skeleton className="h-[300px] w-full rounded-lg" />
                    ) : (
                      overviewStatusTableData?.data.map((project) => {
                        return (
                          <div key={project.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {project.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {project.tasksPerResource} tasks/resource
                              </span>
                            </div>
                            <Progress
                              value={
                                (project.completedTasksPerResource /
                                  project.tasksPerResource) *
                                100
                              }
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {project.completedTasksPerResource} completed
                              tasks per resource
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Times</CardTitle>
                  <CardDescription>
                    Average completion time and delays by project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overviewStatusTableData?.data.map((project) => (
                      <div key={project.key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{project.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {project.taskCompletionRate?.avgCompletionTime}{" "}
                              days avg
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {project.taskCompletionRate?.delayedTasks} delayed
                              tasks
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-green-100 h-2 rounded">
                            <div
                              className="bg-green-500 h-2 rounded"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    project.taskCompletionRate
                                      ?.completionRate || 0,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12">
                            {project.taskCompletionRate?.completionRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Health Score</CardTitle>
                  <CardDescription>
                    Overall project performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overviewStatusTableData?.data.map((project) => {
                      return (
                        <div
                          key={project.key}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Health Score: {project.healthScore}/100
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold ${
                                project.healthScore >= 80
                                  ? "text-green-600"
                                  : project.healthScore >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {project.healthScore >= 80
                                ? "🟢"
                                : project.healthScore >= 60
                                ? "🟡"
                                : "🔴"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline Analysis</CardTitle>
                <CardDescription>
                  Project schedules and milestone tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {overviewStatusTableData?.data.map((project) => {
                    return (
                      <div
                        key={project.key}
                        className="space-y-3 p-4 border rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{project.name}</h4>
                          <Badge variant={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Start Date:
                            </span>
                            <div>{project.timeline?.startDate}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              End Date:
                            </span>
                            <div>{project.timeline?.endDate}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Time Progress</span>
                            <span>{project.timeline?.timeProgress}%</span>
                          </div>
                          <Progress
                            value={project.timeline?.timeProgress}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Task Progress</span>
                            <span>{project.timeline?.taskProgress}%</span>
                          </div>
                          <Progress
                            value={project.timeline?.taskProgress}
                            className="h-2"
                          />
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span
                            className={`flex items-center gap-1 ${
                              project.timeline?.scheduleStatus ===
                              "Behind Schedule"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {project.timeline?.scheduleStatus ===
                            "Behind Schedule" ? (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                Behind Schedule
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                On Track
                              </>
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {project.timeline?.resourcesAssigned} resources
                            assigned
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
