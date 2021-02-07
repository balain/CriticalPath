/* Critical Path Calculation
*
* Based on
* https://www.pmi.org/learning/library/critical-path-method-calculations-scheduling-8040
*
*/

const debug = require('debug')('cp')

const Schedule = require('./schedule')
const Task = require('./task')

const FrappeMaker = require('./frappeMaker')
const frappeGantt = new FrappeMaker()

const schedule = new Schedule()

let aDur = 5
let bDur = 3
let cDur = 6
let dDur = 2
let eDur = 4
let fDur = 4
let gDur = 7
let hDur = 1
let iDur = 5
let jDur = 3
let kDur = 8
let lDur = 2

let a = new Task("a", aDur)
let b = new Task("b", bDur, [a])
let c = new Task("c", cDur, [b])
let d = new Task("d", dDur, [b])
let e = new Task("e", eDur, [c,d])
let f = new Task("f", fDur, [c])
let g = new Task("g", gDur, [e,f])
let h = new Task("h", hDur, [g])
let i = new Task("i", iDur, [g])
let j = new Task("j", jDur, [h])
let k = new Task("k", kDur, [i])
let l = new Task("l", lDur, [j,k])

schedule.addTasks([a,b,c,d,e,f,g,h,i,j,k,l])
schedule.calc()
let cp = schedule.criticalPath()

console.log(`Duration: ${cp.duration}`)
console.table(cp.tasks)

frappeGantt.saveTaskListToGantt(schedule, 'dual-channel.html')
