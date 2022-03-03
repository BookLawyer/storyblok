const pSeries = require('p-series')
const chalk = require('chalk')
const fs = require('fs')
const { capitalize, dateForFile, api } = require('../utils')
const pullComponents = require('./pull-components')
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

  async backupType(type) {
    if (type === 'components') {
      await pullComponents(api, { space: this.sourceSpaceId })
    } else {
      const sourceData = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
        ...(type === 'folders' && {
          folder_only: 1,
          sort_by: 'slug:asc'
        }),
        ...(type === 'stories' && {story_only: 1}),
      })
      console.log(`${chalk.blue('-')} Found ${sourceData.length} ${type}`)
      const fileName = `${type}_backup_${dateForFile()}.json`

      // first create an empty array in the file
      fs.writeFileSync(fileName, JSON.stringify([], null, 2))

      for (var i = 0; i < sourceData.length; i++) {
        const data = await this.client.get('spaces/' + this.sourceSpaceId + '/stories/' + sourceData[i].id)

        const payload = {
          story: data.data.story,
          force_update: '1'
        }

        const fileData = JSON.parse(fs.readFileSync(fileName))
        fs.writeFileSync(fileName, JSON.stringify([payload, ...fileData], null, 2))

        console.log(chalk.green('✓') + ` ${type} ${sourceData[i].name} backed up`)
      }
    }
  }
}
/**
 * @method backup
 * @description Will make a backup for stories, folders or components in a separate file for each type
 * @param  {Array} types
 * @param  {*} options { token: String, source: Number, target-dir: String }
 * @return {Promise}
 */
const backup = (types, options) => {
  BackupSpace.init(options)

  const tasks = types.map((_type) => {
    return () => BackupSpace['backupType'](_type)
  })

  return pSeries(tasks)
}

module.exports = backup
