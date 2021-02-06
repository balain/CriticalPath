/* Critical Path Calculation
 *
 * Based on
 * https://www.pmi.org/learning/library/critical-path-method-calculations-scheduling-8040
 *
 */

const debug = require('debug')('cp')

const Schedule = require('./schedule')
const Task = require('./task')

const schedule = new Schedule()

let a = new Task("a", 5)
let b = new Task("b", 6, [a])
let c = new Task("c", 3, [a])
let d = new Task("d", 4, [b])
let e = new Task("e", 2, [b,c])
let f = new Task("f", 1, [d,e])

schedule.addTasks([a,b,c,d,e,f])

/* Or...
schedule.addTask(a)
schedule.addTask(b)
schedule.addTask(c)
schedule.addTask(d)
schedule.addTask(e)
schedule.addTask(f)
*/

schedule.calc()

let cp = schedule.criticalPath()
console.log(`Duration: ${cp.duration}`)
console.table(cp.tasks)
