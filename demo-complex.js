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
let eDur = 1
let fDur = 4
let gDur = 7
let hDur = 1
let iDur = 5
let jDur = 6
let kDur = 8
let lDur = 2
let mDur = 6
let nDur = 5
let oDur = 12
let pDur = 6
let qDur = 4
let rDur = 8
let sDur = 1

let a = new Task("a", aDur)
let b = new Task("b", bDur, [a])
let c = new Task("c", cDur, [b])
let d = new Task("d", dDur, [b])
let e = new Task("e", eDur, [c,d])
let f = new Task("f", fDur, [d])
let g = new Task("g", gDur, [d])
let h = new Task("h", hDur, [e,f,g])
let i = new Task("i", iDur, [h])
let j = new Task("j", jDur, [h])
let k = new Task("k", kDur, [i])
let l = new Task("l", lDur, [i])
let m = new Task("m", mDur, [j])
let n = new Task("n", nDur, [k,l])
let o = new Task("o", oDur, [m])
let p = new Task("p", pDur, [n])
let q = new Task("q", qDur, [p])
let r = new Task("r", rDur, [p,o])
let s = new Task("s", sDur, [q,r])

schedule.addTasks([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s])
schedule.calc()
let cp = schedule.criticalPath()

console.log(`Duration: ${cp.duration}`)
console.table(cp.tasks)

frappeGantt.saveTaskListToGantt(schedule, 'demo-complex.html')
