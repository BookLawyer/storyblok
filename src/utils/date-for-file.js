/**
 * @method dateForFile
 * @return {String}
 */
const dateForFile = () => {
  const date = new Date()
  let month = date.getMonth() + 1
  month = (month < 10 ? '0' : '') + month
  let day = date.getDate()
  day = (day < 10 ? '0' : '') + day
  return `${date.getFullYear()}_${month}_${day}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`
}

module.exports = dateForFile
