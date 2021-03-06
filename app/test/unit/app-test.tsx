import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as TestUtils from 'react-dom/test-utils'

import { App } from '../../src/ui/app'
import { Dispatcher } from '../../src/ui/dispatcher'
import {
  AppStore,
  GitHubUserStore,
  CloningRepositoriesStore,
  IssuesStore,
  SignInStore,
  RepositoriesStore,
  AccountsStore,
  PullRequestStore,
} from '../../src/lib/stores'
import { InMemoryDispatcher } from '../helpers/in-memory-dispatcher'
import {
  TestGitHubUserDatabase,
  TestIssuesDatabase,
  TestRepositoriesDatabase,
  TestPullRequestDatabase,
} from '../helpers/databases'
import { InMemoryStore, AsyncInMemoryStore } from '../helpers/stores'
import { RepositoryStateCache } from '../../src/lib/stores/repository-state-cache'
import { ApiRepositoriesStore } from '../../src/lib/stores/api-repositories-store'

describe('App', () => {
  let appStore: AppStore | null = null
  let dispatcher: Dispatcher | null = null
  let repositoryStateManager: RepositoryStateCache | null = null
  let githubUserStore: GitHubUserStore | null = null
  let issuesStore: IssuesStore | null = null

  beforeEach(async () => {
    const db = new TestGitHubUserDatabase()
    await db.reset()

    const issuesDb = new TestIssuesDatabase()
    await issuesDb.reset()

    const repositoriesDb = new TestRepositoriesDatabase()
    await repositoriesDb.reset()
    const repositoriesStore = new RepositoriesStore(repositoriesDb)

    const accountsStore = new AccountsStore(
      new InMemoryStore(),
      new AsyncInMemoryStore()
    )

    const pullRequestStore = new PullRequestStore(
      new TestPullRequestDatabase(),
      repositoriesStore
    )

    githubUserStore = new GitHubUserStore(db)
    issuesStore = new IssuesStore(issuesDb)

    repositoryStateManager = new RepositoryStateCache(repo =>
      githubUserStore!.getUsersForRepository(repo)
    )

    const apiRepositoriesStore = new ApiRepositoriesStore(accountsStore)

    appStore = new AppStore(
      githubUserStore,
      new CloningRepositoriesStore(),
      issuesStore,
      new SignInStore(),
      accountsStore,
      repositoriesStore,
      pullRequestStore,
      repositoryStateManager,
      apiRepositoriesStore
    )

    dispatcher = new InMemoryDispatcher(appStore, repositoryStateManager)
  })

  it('renders', async () => {
    const app = TestUtils.renderIntoDocument<any>(
      <App
        dispatcher={dispatcher!}
        appStore={appStore!}
        repositoryStateManager={repositoryStateManager!}
        issuesStore={issuesStore!}
        gitHubUserStore={githubUserStore!}
        startTime={0}
      />
    )
    // Give any promises a tick to resolve.
    await wait(0)

    // @ts-ignore
    const node = ReactDOM.findDOMNode(app)
    expect(node).not.toBeNull()
  })
})

function wait(timeout: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout)
  })
}
