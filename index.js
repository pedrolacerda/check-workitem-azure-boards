// Checks API example
// See: https://developer.github.com/v3/checks/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

/*
 * Import Azure DevOps Nodejs API
 * @param {import('azure-devops-node-api')} azdev
 */

const azdev = require('azure-devops-node-api')
const getConfig = require('probot-config')

module.exports = app => {
  app.on(['pull_request.opened', 'pull_request.edited'], check)

  async function check (context) {
    const config = await getConfig('ado.yml')

    if (config.error) {
      // report config error in check
      let e = {
        conclusion: 'failure',
        title: 'Configuration Error',
        message: config.error
      }
      await createCheck(context, e)
    } else {
      const api_url = config.api_url
      const api_token = config.api_token
      const api_project = config.api_project
    }

    const startTime = new Date()
    const payload = context.payload
    const pullRequests = payload.check_suite.pull_requests

    const { head_branch: headBranch, head_sha: headSha } = context.payload.check_suite

    let queryResult = await context.github.query(getPullRequestCommits, {
      owner: context.payload.organization.login,
      // owner: "pedrolacerda",
      name: context.repo().repo,
      number: parseInt(pullRequests[0].number)
    })

    let connection = await getAzDevConnection(api_token, api_url)
    let workItemApi = await connection.getWorkItemTrackingApi()
    let workItemAssigned = await workItemExists(queryResult, workItemApi, api_project)

    console.log('Function return: ' + workItemAssigned)
    // WorkItem assigned and exists in Azure Boards
    if (workItemAssigned == 1) {
      return context.github.checks.create(context.repo({
        name: 'Required Azure Boards WorkItem',
        head_branch: headBranch,
        head_sha: headSha,
        status: 'completed',
        started_at: startTime,
        conclusion: 'success',
        completed_at: new Date(),
        output: {
          title: 'Azure Boards WorkItem exists!',
          summary: 'The check has passed!'
        }
      }))

      // WorkItem assigned but doesn't exists in Azure Boards
    } else if (workItemAssigned == 0) {
      return context.github.checks.create(context.repo({
        name: 'Required Azure Boards Work Item',
        head_branch: headBranch,
        head_sha: headSha,
        status: 'completed',
        started_at: startTime,
        conclusion: 'failure',
        completed_at: new Date(),
        output: {
          title: "Azure Boards Work Item doesn't exist!",
          summary: 'The check has failed!'
        }
      }))
    }

    // No WorkItem assigned in any commit
    else {
      return context.github.checks.create(context.repo({
        name: 'Required Azure Boards WorkItem',
        head_branch: headBranch,
        head_sha: headSha,
        status: 'completed',
        started_at: startTime,
        conclusion: 'failure',
        completed_at: new Date(),
        output: {
          title: 'No Azure Boards WorkItem has been assigned!',
          summary: 'The check has failed!'
        }
      }))
    }
  }
}

/*
 * GraphQL query to get messages from all commits
 */
const getPullRequestCommits = `
    query repository($owner: String!, $name: String!, $number: Int!){
      repository(owner: $owner, name: $name){
        pullRequest(number: $number) {
          commits(first: 250){
            nodes{
              commit{
                message
              }
            }
          }
        }
      }
    }
  `

/*
 * Get Azure DevOps Connection
 */
const getAzDevConnection = async (api_token, api_url) => {
  let authHandler = azdev.getPersonalAccessTokenHandler(api_token)
  return connection = new azdev.WebApi(api_url, authHandler)
}

/*
 * Regex to extract Azure Boards WorkItem
 */
const regex = /AB#\d+/

/*
 * Search for existing Work Items in Azure Boards
 * returns:
 * 1: At least one WorkItem assigned exists in Azure Boards
 * 0: None of the WorkItem exist in Azure Boards
 * -1: No WorkItem assigned in any commit
 */
async function workItemExists (queryResult, workItemApi, api_project) {
  let workItemAssigned = -1

  for (const element of queryResult.repository.pullRequest.commits.nodes) {
    let commitMessage = element.commit.message
    let workItem = regex.exec(commitMessage)

    if (workItem !== null && workItemAssigned != 1) {
      console.log('Work Item Assigned')

      // Gets Work Item's ID from the string
      let workItemId = workItem[0].substring(workItem[0].indexOf('#') + 1, workItem[0].length)
      console.log('WorkItem ID: ' + workItemId)

      workItemAssigned = 0

      let workItemReturned = await workItemApi.getWorkItem(parseInt(workItemId), null, null, null, api_project)

      if (workItemReturned != null) {
        workItemAssigned = 1
        console.log('Work item exists: ' + workItemAssigned)
        return workItemAssigned
      } else {
        console.log("Work item doesn't exist: " + workItemAssigned)
      }
    }
  }
  return workItemAssigned
}
