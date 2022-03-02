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
    let foundFile = null
    const filenames = fs.readdirSync('./')
    for (var f = 0; f < filenames.length; f++) {
      if (filenames[f].includes('folders')) {
        foundFile = filenames[f]
      }
    }
    console.log(chalk.green('✓') + ' Found last backuped file...')
    const rawFolders = fs.readFileSync(foundFile)
    const folders = JSON.parse(rawFolders)

    for (var f = 0; f < folders.length; f++) {
      try {
        if (folders[f].story.parent_id) {
          // Parent child resolving
          const folderSlug = folders[f].story.full_slug.split('/')
          const parentFolderSlug = folderSlug.splice(0, folderSlug.length - 1).join('/')

          const parentFolders = await this.client.get(`spaces/${this.targetSpaceId}/stories`, {
            with_slug: parentFolderSlug
          })

          if (parentFolders.data.stories.length) {
            folders[f].story.parent_id = parentFolders.data.stories[0].id
          }
        }
        createdFolder = await this.client.post('spaces/' + this.targetSpaceId + '/stories', folders[f])
        console.log(chalk.green('✓') + ` Folder ${folders[f].story.name} created`)
      } catch (e) {
        console.error(
          chalk.red('X') + ` Folder ${folders[f].story.name} Sync failed: ${e.message}`
        )
        console.log(e)
      }
    }
  },

  // restore stories
  async restoreStories() {
    console.log(chalk.green('✓') + ' Restoring stories...')
    const targetFolders = await this.client.getAll(`spaces/${this.targetSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })

    let folderMapping = {}

    for (let i = 0; i < targetFolders.length; i++) {
      var folder = targetFolders[i]
      folderMapping[folder.full_slug] = folder.id
    }

    let foundFile = null
    const filenames = fs.readdirSync('./')
    for (var f = 0; f < filenames.length; f++) {
      if (filenames[f].includes('stories')) {
        foundFile = filenames[f]
      }
    }
    console.log(chalk.green('✓') + ' Found last backuped file...')
    const rawStories = fs.readFileSync(foundFile)
    const stories = JSON.parse(rawStories)

    for (var f = 0; f < stories.length; f++) {
      const slugs = stories[f].story.full_slug.split('/')
      let folderId = 0

      if (slugs.length > 1) {
        slugs.pop()
        var folderSlug = slugs.join('/')

        if (folderMapping[folderSlug]) {
          folderId = folderMapping[folderSlug]
        } else {
          console.error(chalk.red('X') + 'The folder does not exist ' + folderSlug)
          continue
        }
      }

      stories[f].story.parent_id = folderId
      createdStory = await this.client.post('spaces/' + this.targetSpaceId + '/stories', stories[f])
      console.log(chalk.green('✓') + ` Story ${stories[f].story.name} created`)
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
