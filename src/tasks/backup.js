const pSeries = require('p-series')
const chalk = require('chalk')
const fs = require('fs')
const { capitalize } = require('../utils')
const StoryblokClient = require('storyblok-js-client')

const BackupSpace = {
  init (options) {
    console.log(chalk.green('✓') + ' Loading options')
    this.sourceSpaceId = options.source
    this.targetDir = options.target
    this.oauthToken = options.token
    this.client = new StoryblokClient({
      oauthToken: options.token
    }, options.api)
  },

  async checkforUnfinishedBackup(type) {
    // retrieve all data from source
    const data = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
      ...(type === 'folders' && {
        folder_only: 1,
        sort_by: 'slug:asc'
      }),
      ...(type === 'stories' && {story_only: 1}),
    })

    // find the last backup file
    let foundFile = null
    const filenames = fs.readdirSync(this.targetDir)
    for (var f = 0; f < filenames.length; f++) {
      if (filenames[f].includes(type)) {
        foundFile = filenames[f]
      }
    }

    // read file and check if it is a complete backup
    const rawData = fs.readFileSync(foundFile)
    const fileData = JSON.parse(rawStories)

    // backup didn't finish correctly
    if (fileData.length == data.length ) {
      return false
    }

    return true
  },

  async backupFolders() {
    const sourceFolders = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })
    const fileName = `folders_backup_${dateForFile()}.json`

    fs.createWriteStream(fileName, {flags:'a'})

    
  }
}
/**
 * @method backup
 * @description Will make a backup for stories, folders or components in a separate file for each type
 * @param  {Array} types
 * @param  {*} options { token: String, source: Number, target-dir: String }
 * @return {Promise}
 */
const restore = (types, options) => {
  BackupSpace.init(options)

  const tasks = types.sort((a, b) => {
    if (a === 'folders') return -1
    if (b === 'folders') return 1
    return 0
  }).map(_type => {
    const command = `backup${capitalize(_type)}`

    return () => BackupSpace[command]()
  })

  return pSeries(tasks)
}

module.exports = backup
