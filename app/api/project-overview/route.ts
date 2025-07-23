import { BASE_URL, REQUEST_INIT } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';
interface JiraProjectSearchResponse {
    self: string;
    maxResults: number;
    startAt: number;
    total: number;
    isLast: boolean;
    values: JiraProject[];
}

interface JiraProject {
    expand: string;
    self: string;
    id: string;
    key: string;
    description: string;
    lead: JiraUser;
    issueTypes: IssueType[];
    name: string;
    avatarUrls: AvatarUrls;
    projectTypeKey: string;
    simplified: boolean;
    style: string;
    isPrivate: boolean;
    properties: Record<string, any>;
    entityId: string;
    uuid: string;
    insight: Insight;
}

interface JiraUser {
    self: string;
    accountId: string;
    accountType: string;
    avatarUrls: AvatarUrls;
    displayName: string;
    active: boolean;
}

interface IssueType {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
    avatarId: number;
    hierarchyLevel: number;
}

interface AvatarUrls {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
}

interface Insight {
    totalIssueCount: number;
    lastIssueUpdateTime: string;
}

async function fetchProjects(): Promise<JiraProjectSearchResponse> {
    try {
        const res = await fetch(`${BASE_URL}/project/search?expand=description,lead,url,issueTypes,insight`, REQUEST_INIT);
        const data = await res.json();
        return data;

    } catch (error) {

        throw new Error('Failed to fetch projects');
    }

}

const getGlobalTaskCounts = async () => {
    // try {

    //     const statusQueries = {
    //         todo: 'statusCategory="To Do"',
    //         inProgress: 'statusCategory="In Progress"',
    //         done: 'statusCategory="Done"',
    //         blocked: 'status="BLOCKED"',
    //         testing: 'status="TESTING"',
    //         total: 'project is not EMPTY'
    //     };

    //     const results: { [key: string]: string } = {};

    //     for (const [key, jql] of Object.entries(statusQueries)) {
    //         const response = await fetch(
    //             `${BASE_URL}/search?` +
    //             `jql=${encodeURIComponent(jql)}&maxResults=0`,
    //             REQUEST_INIT
    //         );

    //         const data = await response.json();
    //         results[key] = data.total;
    //     }

    //     console.log(results, "Global Task Counts: ");

    //     return results;
    // } catch (error) {
    //     console.error('Error fetching global task counts:', error);
    //     throw new Error('Failed to fetch global task counts');

    // }
    try {
        let allIssues = [];
        let startAt = 0;
        const maxResults = 100; // Try the highest value that works for your instance

        // Fetch all issues using pagination
        while (true) {
            const response = await fetch(
                `${BASE_URL}/search?` +
                `jql=${encodeURIComponent('project is not EMPTY')}&` +
                `maxResults=${maxResults}&` +
                `startAt=${startAt}&` +
                `fields=status`,
                REQUEST_INIT
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            allIssues.push(...data.issues);

            console.log(`Fetched ${allIssues.length}/${data.total} issues`);

            // Break if we got all issues or less than maxResults (last page)
            if (allIssues.length >= data.total || data.issues.length < maxResults) {
                break;
            }

            startAt += maxResults;
        }

        // Count all statuses in a single pass
        const results = {
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
            testing: 0,
            total: allIssues.length
        };

        allIssues.forEach((issue) => {
            const status = issue.fields.status;
            const statusName = status.name;
            const statusCategory = status.statusCategory.name;
            console.log('statusCategory: ', statusCategory);

            // Count by status category
            switch (statusCategory) {
                case 'To Do':
                    results.todo++;
                    break;
                case 'In Progress':
                    results.inProgress++;
                    break;
                case 'Done':
                    results.done++;
                    break;
                case 'Ready for Launch':
                    results.done++;
                    break;
            }

            // Count specific statuses
            if (statusName === 'Blocked') {
                results.blocked++;
            } else if (statusName === 'Testing') {
                results.testing++;
            }
        });

        return results;

    } catch (error) {
        console.error('Error fetching status counts:', error);
        return {
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
            testing: 0,
            total: 0
        };
    }
};

async function getAllUsers(): Promise<JiraUser[]> {
    try {
        const res = await fetch(`${BASE_URL}/users/search`, REQUEST_INIT);
        const data = await res.json();
        console.log('data: ', data);
        return data;
    } catch (error) {

        throw new Error('Failed to fetch users');
    }
}


export async function GET(req: NextRequest) {

    try {

        const projects = await fetchProjects();
        const users = await getAllUsers();
        const atlassianUsers = users.filter(user => user.accountType === 'atlassian');
        const globalTaskCounts = await getGlobalTaskCounts();

        const totalIssues = projects.values.reduce((acc, project) => acc + project.insight.totalIssueCount, 0);
        const response = {
            totalProjects: projects.total,
            totalIssues,
            totalResources: atlassianUsers.length,
            globalTaskCounts
        };

        return NextResponse.json(response);
    } catch (error) {

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    }

}