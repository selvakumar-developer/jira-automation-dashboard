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
    try {

        const statusQueries = {
            todo: 'statusCategory="To Do"',
            inProgress: 'statusCategory="In Progress"',
            done: 'statusCategory="Done"',
            total: 'project is not EMPTY'
        };

        const results: { [key: string]: string } = {};

        for (const [key, jql] of Object.entries(statusQueries)) {
            const response = await fetch(
                `${BASE_URL}/search?` +
                `jql=${encodeURIComponent(jql)}&maxResults=0`,
                REQUEST_INIT
            );

            const data = await response.json();
            results[key] = data.total;
        }

        return results;
    } catch (error) {
        console.error('Error fetching global task counts:', error);
        throw new Error('Failed to fetch global task counts');

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