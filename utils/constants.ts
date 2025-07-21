const EMAIL = process.env.EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const BASE_URL = process.env.BASE_URL;

const REQUEST_INIT = {
    method: 'GET',
    headers: {
        'Authorization': `Basic ${Buffer.from(
            `${EMAIL}:${JIRA_API_TOKEN}`
        ).toString('base64')}`,
        'Accept': 'application/json'
    }
}

export {
    BASE_URL, EMAIL,
    JIRA_API_TOKEN,
    REQUEST_INIT
};
