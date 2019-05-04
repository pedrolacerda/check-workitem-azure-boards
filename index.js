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

const getPullRequest = `
  query repository(owner: "pedrolacerda", name:"bookstore"){
    pullRequest(number: 10) {
      commits(first: 100){
        nodes{
          commit{
            message
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

    getProperties(context.github.pullRequests)

    context.github.query(getPullRequest, {
      number: context.payload.check_suite.pull_requests[0],
      owner: 'pedrolacerda',
      repo: context.repo().repo,
    })

    // const payload = context.payload
    // pull_requests = payload.check_suite.pull_requests

    // const pr_data = {
    //   // owner: context.repo().username,
    //   owner: "LacerdaCorp",
    //   repo: context.repo().repo,
    //   number: 2
    // }

    // const pr = context.github.issues.listForAuthenticatedUser()


    // pull_requests.forEach(element => {
    //   var pr_number = element.number

    //   pr_data.number = pr_number

    //   var pr = context.github.pullRequests.list(pr_data)
      
    // })

    var workItem = {
      id: null,
      exists: false
    }    

    const { head_branch: headBranch, head_sha: headSha } = context.payload.check_suite
    // Probot API note: context.repo() => {username: 'hiimbex', repo: 'testing-things'}
    if (workItem.exists){
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
    } if(!workItem.exists) {
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
          title: "Azure Boards Work Item doesn't exist!",
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
