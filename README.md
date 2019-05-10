# check-workitem-azure-boards

> A GitHub App built with [Probot](https://github.com/probot/probot) that checks if the PR has any valid Azure Boards WorkItems assigned 

![image](https://user-images.githubusercontent.com/609076/57497682-0463bf80-72af-11e9-9277-f2419a222325.png)

## App Page
https://github.com/apps/check-workitem-azure-boards/

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```
### Configure environment variables
You'll need three extra enviroment variables configured in your `.env` file:
1. **API_URL**: The URL of your Azure DevOps org
1. **API_TOKEN**: Your Personal Acess Token used to authenticate with Azure DevOps
1. **API_PROJECT**: The name of the project you want to query for Work Items

_Check the `.env.example` file for more info_

## Contributing

If you have suggestions for how check-workitem-azure-boards could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Pedro Lacerda <pedrolacerda@github.com> (https://github.com/pedrolacerda)
