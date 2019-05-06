// Checks API example
// See: https://developer.github.com/v3/checks/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

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

const getPullRequestCommits = `
    query repository($owner: String!, $name: String!, $number: Int!){
      repository(owner: $owner, name: $name){
        pullRequest(number: $number) {
          commits(first: 100){
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

module.exports = app => {
  app.on(['check_suite.requested', 'check_run.rerequested'], check)

  async function check (context) {
    const startTime = new Date()
    // getProperties(context.payload)

    const payload = context.payload
    pullRequests = payload.check_suite.pull_requests

    // pullRequests.forEach(element => {
    //   var pr_number = element.number

    //   pr_data.number = pr_number

    //   var pr = context.github.pullRequests.list(pr_data)
      
    // })
 
    let queryResult = await context.github.query(getPullRequestCommits, {
      owner: 'LacerdaCorp',
      name: context.repo().repo,
      number: parseInt(pullRequests[0].number)
    })

    var workItem = {
      id: null,
      exists: false
    }

    queryResult.repository.pullRequest.commits.nodes.forEach(element => {
      
      var commitMessage = element.commit.message
      if(commitMessage.includes("AB#")){
        app.log("Work Item Assigned")
        workItem.id = 0

        //Call Azure Boards API
        if(commitMessage.includes("AB#12") || commitMessage.includes("AB#13") || commitMessage.includes("AB#14") || commitMessage.includes("AB#15") ||
        commitMessage.includes("AB#16") || commitMessage.includes("AB#17") || commitMessage.includes("AB#18") || commitMessage.includes("AB#19") ||
        commitMessage.includes("AB#20") || commitMessage.includes("AB#11")){
          workItem.exists = true
          workItem.id = 15
          app.log("Work Item Exists")
          return

        } 
      }else {
        app.log("Work Item Doesn't exist")
      }
    })

    const { head_branch: headBranch, head_sha: headSha } = context.payload.check_suite
    // Probot API note: context.repo() => {username: 'hiimbex', repo: 'testing-things'}
    if (workItem.id && workItem.exists){
      return context.github.checks.create(context.repo({
        name: 'Required Azure Boards Work Item',
        head_branch: headBranch,
        head_sha: headSha,
        status: 'completed',
        started_at: startTime,
        conclusion: 'success',
        completed_at: new Date(),
        output: {
          title: 'Azure Boards Work Item exists!',
          summary: 'The check has passed!'
        }
      }))
    } else if(workItem.id !== null && !workItem.exists) {
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
    else {
      return context.github.checks.create(context.repo({
        name: 'Required Azure Boards Work Item',
        head_branch: headBranch,
        head_sha: headSha,
        status: 'completed',
        started_at: startTime,
        conclusion: 'failure',
        completed_at: new Date(),
        output: {
          title: "No Azure Boards Work Item has been assigned!",
          summary: 'The check has failed!'
        }
      }))
    }
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
