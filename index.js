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

// Just for logging purposes
function getProperties(obj)
{
    var res = [];
    var item = {};
    for(var m in obj) {
        // if(typeof obj[m] == "function") {
          // res.push(m);  
          item.type = typeof obj[m]
          item.obj = m
          console.log("Property: "+item.type +" "+ item.obj)
          res.push(item)
        // }
    }
    return res;
}

module.exports = app => {

  app.on(['check_suite.requested', 'check_run.rerequested'], check)

  async function check (context) {
    const startTime = new Date()
    const payload = context.payload
    pullRequests = payload.check_suite.pull_requests

    // pullRequests.forEach(element => {
    //   var pr_number = element.number
    //   pr_data.number = pr_number
    //   var pr = context.github.pullRequests.list(pr_data)
    // })
 
    let queryResult = await context.github.query(getPullRequestCommits, {
      owner: context.payload.organization.login,
      name: context.repo().repo,
      number: parseInt(pullRequests[0].number)
    })

    let connection = await getAzDevConnection()
    let workItemApi = await connection.getWorkItemTrackingApi();

    let hasWorkItems = workItemExists(queryResult, workItemApi)
    console.log("Chegou aqui");

    hasWorkItems.then(function (result){
      const { head_branch: headBranch, head_sha: headSha } = context.payload.check_suite
    // Probot API note: context.repo() => {username: 'hiimbex', repo: 'testing-things'}

    // WorkItem assigned and exists in Azure Boards
    if (1){
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
    } else if(0) {
        return context.github.checks.create(context.repo({
          name: 'Required Azure Boards WorkItem',
          head_branch: headBranch,
          head_sha: headSha,
          status: 'completed',
          started_at: startTime,
          conclusion: 'failure',
          completed_at: new Date(),
          output: {
            title: "Azure Boards WorkItem doesn't exist!",
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
          title: "No Azure Boards WorkItem has been assigned!",
          summary: 'The check has failed!'
        }
      }))
    }
    })
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
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
              cursor
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    }
    
  `

/*
 * Get Azure DevOps Connection 
 */
const getAzDevConnection = async () => {
  let apiUrl = process.env.API_URL;

  let token = process.env.API_TOKEN; // e.g "cbdeb34vzyuk5l4gxc4qfczn3lko3avfkfqyb47etahq6axpcqha"; 

  let authHandler = azdev.getPersonalAccessTokenHandler(token); 
  return connection = new azdev.WebApi(apiUrl, authHandler);  
}

/*
 * Regex to extract Azure Boards WorkItem
 */
const regex = /AB#\d+/;

const getAzBoardsWorkItem = async(workItemApi, workItemId, project) => {
  workItemApi.getWorkItem(parseInt(workItemId), null, null, null, project)
}

/*
 * Search for existing Work Items in Azure Boards
 * returns:
 * 1: At least one WorkItem assigned exists in Azure Boards
 * 0: None of the WorkItem exist in Azure Boards
 * -1: No WorkItem assigned in any commit
 */
const workItemExists = async (queryResult, workItemApi) => {
  queryResult.repository.pullRequest.commits.nodes.forEach(element => {
  
    let commitMessage = element.commit.message
    let workItem = regex.exec(commitMessage)

    if(workItem !== null){
      //app.log("Work Item Assigned")

      let workItemId = workItem[0].substring(workItem[0].indexOf("#")+1,workItem[0].length);
      console.log("WorkItem ID: "+ workItemId)

      //Call Azure Boards API
      let azDevWorkItem = workItemApi.getWorkItem(parseInt(workItemId), null, null, null, process.env.API_PROJECT)
      // let azDevWorkItem = await getAzBoardsWorkItem(workItemApi, workItemId, process.env.API_PROJECT);

      azDevWorkItem.then(function (result){
        if(result != null){
          workItem.exists = true
          workItem.id = workItemId
          console.log("Work Item Exists")
          return 1
        } else {
          return 0
        }
      })
    } else {
      return -1
    }
  })
}