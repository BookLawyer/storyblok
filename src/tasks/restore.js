const pSeries = require('p-series')
const chalk = require('chalk')
const fs = require('fs')
const { capitalize } = require('../utils')
const StoryblokClient = require('storyblok-js-client')

const RestoreSpace = {
  init (options) {
    console.log(chalk.green('✓') + ' Loading options')
    this.targetSpaceId = options.target
    this.oauthToken = options.token
    this.client = new StoryblokClient({
      oauthToken: options.token
    }, options.api)
  },

  // restore folders
  async restoreFolders() {
    console.log(chalk.green('✓') + ' Looking for backup file...')
    let foundedFile = null
    const filenames = fs.readdirSync('./')
    for (var f = 0; f < filenames.length; f++) {
      if (filenames[f].includes('folders')) {
        foundedFile = filenames[f]
      }
    }
    console.log(chalk.green('✓') + ' Found last backuped file...')
    const rawFolders = fs.readFileSync(foundedFile)
    const folders = JSON.parse(rawFolders)

    for (var f = 0; f < folders.folders.length; f++) {
      createdFolder = await this.client.post('spaces/' + this.targetSpaceId + '/stories', folders.folders[f])
      console.log(chalk.green('✓') + ` Folder ${folders.folders[f].story.name} created`)
    }
  },

  // restore stories
  async restoreStories() {
    console.log(chalk.green('✓') + ' Restoring stories...')
    let foundedFile = null
    const filenames = fs.readdirSync('./')
    for (var f = 0; f < filenames.length; f++) {
      if (filenames[f].includes('stories')) {
        foundedFile = filenames[f]
      }
    }
    console.log(chalk.green('✓') + ' Found last backuped file...')
    const rawStories = fs.readFileSync(foundedFile)
    const stories = JSON.parse(rawStories)

    for (var f = 0; f < stories.stories.length; f++) {
      createdStory = await this.client.post('spaces/' + this.targetSpaceId + '/stories', stories.stories[f])
      console.log(chalk.green('✓') + ` Story ${stories.stories[f].story.name} created`)
    }
  },

}

/**
 * @method restore
 * @param  {Array} types
 * @param  {*} options      { token: String, target: Number, api: String }
 * @return {Promise}
 */
const restore = (types, options) => {
  RestoreSpace.init(options)

  const tasks = types.sort((a, b) => {
    if (a === 'folders') return -1
    if (b === 'folders') return 1
    return 0
  }).map(_type => {
    const command = `restore${capitalize(_type)}`

    return () => RestoreSpace[command]()
  })

  return pSeries(tasks)
}

module.exports = restore
