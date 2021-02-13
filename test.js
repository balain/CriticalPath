const test = require('ava')

const Schedule = require('./schedule')
const Task = require('./task')

function getRandomSingleDigitNonZeroInt() {
	return(getRandomInt(1,9))
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function sumDurations(durs) {
	return durs.reduce((a,b) => a + b, 0)
}

test.beforeEach(t => { })

test('schedule-toString', t => {
	const schedule = new Schedule()
	schedule.addTask(new Task("a", 10))
	console.log(schedule.toString())
	t.pass()
})

test('task-to-string', t => {
  const task = new Task("a", 10)
  console.log(task.toString())
  t.true(task.toString() === `Task: a: Start: undefined; Dur: 10; ES: -1; EF: -1; LS: 9999; LF: 9999; Pred count: 0; Succ count: 0`)
})

test('pred-succ-errors', t => {
	const schedule = new Schedule()
	let a = new Task("a", 3)
  let b = new Task("b", 10)
  let c = new Task("c", a, b)
  
  t.throws(() => { a.addSucc("b"); }, { instanceOf: TypeError })
  t.throws(() => { b.addPred("a"); }, { instanceOf: TypeError })
  t.pass()
})

test('pred-succ-setting', t => {
	const schedule = new Schedule()
	let a = new Task("a", 3)
  let b = new Task("b", 10)
  b.setPreds(a)
  t.pass()
})

/*
 * Single Critical Path: Simple short single channel
 * a - b - c
 *
 * Critical Path:
 * a - b - c
 *
 */
test('single-cp-simple-short-single-channel', t => {
	const schedule = new Schedule()

	let aDur = getRandomSingleDigitNonZeroInt()
	let bDur = getRandomSingleDigitNonZeroInt()
	let cDur = getRandomSingleDigitNonZeroInt()

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	
	schedule.addTasks([a,b,c])
	schedule.calc()
	let cp = schedule.criticalPath()
	t.is(cp.tasks.length, 3)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur]))
})

/*
 * Single Critical Path: Simple long single channel
 * a - b - c - d - e - f
 *
 * Critical Path:
 *
 * a - b - c - d - e - f
 *
 */
test('single-cp-simple-long-single-channel', t => {
	const schedule = new Schedule()

	let aDur = getRandomSingleDigitNonZeroInt()
	let bDur = getRandomSingleDigitNonZeroInt()
	let cDur = getRandomSingleDigitNonZeroInt()
	let dDur = getRandomSingleDigitNonZeroInt()
	let eDur = getRandomSingleDigitNonZeroInt()
	let fDur = getRandomSingleDigitNonZeroInt()

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [c])
	let e = new Task("e", eDur, [d])
	let f = new Task("f", fDur, [e])
	
	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, dDur, eDur, fDur]))
})

/*
 * Single Critical Path: Simple dual channel
 * a - b - d - e - f
 *       \   /
 *         c
 *
 * Critical Path:
 *
 * a - b - c - e - f
 *
 */
test('single-cp-simple-dual-channel', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = 2
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [e])
	
	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 5)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.false(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
})

/*
 * Single Critical Path: Simple alt dual channel
 * a - b - d - e - f
 *       \   /   /
 *         c ----
 *
 * Critical Path:
 *
 * a - b - c - e - f
 *
 */
test('single-cp-simple-alt-dual-channel', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = 2
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [c,e])
	
	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 5)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.false(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
})

/*
 * Single Critical Path: Complex dual channel
 * a - b - d - e - g - h - j - l
 *       \   /   /   \       /
 *         c - f       i - k
 *
 * Critical Path:
 *
 * a - b - c - f - g - i - k - l
 *
 */
test('single-cp-complex-dual-channel', t => {
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
	
	t.is(cp.tasks.length, 8)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.false(cp.tasks.includes(d))
	t.false(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.true(cp.tasks.includes(g))
	t.false(cp.tasks.includes(h))
	t.true(cp.tasks.includes(i))
	t.false(cp.tasks.includes(j))
	t.true(cp.tasks.includes(k))
	t.true(cp.tasks.includes(l))

	t.is(cp.duration, sumDurations([aDur, bDur, cDur, fDur, gDur,iDur,kDur,lDur]))
})

/*
 * Single Critical Path: Simple triple channel
 * a - b - c - e
 *       \   /   \
 *         d - f - h - i
 *           \   /
 *             g
 *
 * Critical Path:
 *
 * a - b - d - g - h - i
 *
 */
test('single-cp-simple-triple-channel', t => {
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

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [d])
	let g = new Task("g", gDur, [d])
	let h = new Task("h", hDur, [e,f,g])
	let i = new Task("i", iDur, [h])
	
	schedule.addTasks([a,b,c,d,e,f,g,h,i])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.false(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.false(cp.tasks.includes(e))
	t.false(cp.tasks.includes(f))
	t.true(cp.tasks.includes(g))
	t.true(cp.tasks.includes(h))
	t.true(cp.tasks.includes(i))

	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur,iDur]))
})

/*
 * Single Critical Path: Moderate triple channel
 * a - b - c - e           k - n - p - q
 *       \   /   \       /   /       \   \
 *         d - f - h - i - l           r - s
 *           \   /   \               /
 *             g       j - m - o - -
 *
 * Critical Path:
 *
 * a - b - d - g - h - i - k - n - p - r - s
 *
 */
test('single-cp-moderate-triple-channel', t => {
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
	let jDur = 3
	let kDur = 8
	let lDur = 2
	let mDur = 1
	let nDur = 5
	let oDur = 3
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
	
	t.is(cp.tasks.length, 11)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.false(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.false(cp.tasks.includes(e))
	t.false(cp.tasks.includes(f))
	t.true(cp.tasks.includes(g))
	t.true(cp.tasks.includes(h))
	t.true(cp.tasks.includes(i))
	t.false(cp.tasks.includes(j))
	t.true(cp.tasks.includes(k))
	t.false(cp.tasks.includes(l))
	t.false(cp.tasks.includes(m))
	t.true(cp.tasks.includes(n))
	t.false(cp.tasks.includes(o))
	t.true(cp.tasks.includes(p))
	t.false(cp.tasks.includes(q))
	t.true(cp.tasks.includes(r))
	t.true(cp.tasks.includes(s))

	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur,iDur,kDur,nDur,pDur,rDur,sDur]))
})

/*
 * Dual Critical Path: Simple dual channel
 * a - b - d - e - f
 *       \   /
 *         c
 *
 * Critical Paths:
 *
 * a - b - c - e - f
 * a - b - d - e - f
 *
 */
test('dual-cp-simple-dual-channel', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = cDur
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [e])
	
	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
	// console.table(cp.tasks)
})

/*
 * Dual Critical Path: Complex dual channel
 * a - b - d - e - g - h - j - l
 *       \   /   /   \       /
 *         c - f       i - k
 *
 * Critical Paths:
 *
 * a - b - c - e - g - i - k - l
 * a - b - c - f - g - i - k - l
 *
 */
test('dual-cp-complex-dual-channel', t => {
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
	
	t.is(cp.tasks.length, 9)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.false(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.true(cp.tasks.includes(g))
	t.false(cp.tasks.includes(h))
	t.true(cp.tasks.includes(i))
	t.false(cp.tasks.includes(j))
	t.true(cp.tasks.includes(k))
	t.true(cp.tasks.includes(l))

	t.is(cp.duration, sumDurations([aDur, bDur, cDur, fDur, gDur,iDur,kDur,lDur]))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, gDur,iDur,kDur,lDur]))
})

/*
 * Dual Critical Path: Moderate triple channel
 * a - b - c - e           k - n - p - q
 *       \   /   \       /   /       \   \
 *         d - f - h - i - l           r - s
 *           \   /   \               /
 *             g       j - m - o - - 
 *
 * Critical Paths:
 *
 * a - b - d - g - h - i - k - n - p - r - s
 * a - b - d - g - h - j - m - o - r - s
 *
 */
test('dual-cp-moderate-triple-channel', t => {
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
	let n = new Task("n", nDur, [l])
  k.setSuccs([n])
	let o = new Task("o", oDur, [m])
	let p = new Task("p", pDur, [n])
	let q = new Task("q", qDur, [p])
	let r = new Task("r", rDur)
  r.addPred(p)
  o.setSuccs(r)
	let s = new Task("s", sDur, [q,r])
	
	schedule.addTasks([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s])
	schedule.calc()
	let cp = schedule.criticalPath()
	
	t.is(cp.tasks.length, 14)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.false(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.false(cp.tasks.includes(e))
	t.false(cp.tasks.includes(f))
	t.true(cp.tasks.includes(g))
	t.true(cp.tasks.includes(h))
	t.true(cp.tasks.includes(i))
	t.true(cp.tasks.includes(j))
	t.true(cp.tasks.includes(k))
	t.false(cp.tasks.includes(l))
	t.true(cp.tasks.includes(m))
	t.true(cp.tasks.includes(n))
	t.true(cp.tasks.includes(o))
	t.true(cp.tasks.includes(p))
	t.false(cp.tasks.includes(q))
	t.true(cp.tasks.includes(r))
	t.true(cp.tasks.includes(s))

	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur,iDur,kDur,nDur,pDur,rDur,sDur]))
	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur,jDur,mDur,oDur,rDur,sDur]))
  
  schedule.calcCriticalPaths()
  
  t.true(schedule.countCriticalPaths() == 2)

  let criticalPaths = schedule.criticalPaths

  t.true(criticalPaths[0].join('-') == `a-b-d-g-h-i-k-n-p-r-s`)
  t.true(criticalPaths[1].join('-') == `a-b-d-g-h-j-m-o-r-s`)
})

/*
 * Get the head tasks for all critical paths
 * a - b - d - e - f
 *       \   /
 *         c
 *
 * Returns
 * a
 *
 */
test('getHeadAndTailTasks', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = cDur
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [e])

	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()

	t.deepEqual(schedule.getHeadTasks(), [a])
	t.deepEqual(schedule.getTailTasks(), [f])
})

/*
 * Count Multiple Critical Paths: Simple dual channel
 * a - b - d - e - f
 *       \   /
 *         c
 *
 * Critical Path Count: 2
 *
 * a - b - c - e - f
 * a - b - d - e - f
 *
 */
test('count-multiple-critical-paths', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = cDur
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [e])

	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()

  t.is(schedule.countCriticalPaths(),2)

})

/*
 * Print Multiple Critical Paths: Simple dual channel
 * a - b - d - e - f
 *       \   /
 *         c
 *
 * Critical Paths:
 *
 * a - b - c - e - f
 * a - b - d - e - f
 *
 * Where duration of "c" == duration of "d"
 */
test('print-multiple-critical-paths', t => {
	const schedule = new Schedule()

	let aDur = 5
	let bDur = 3
	let cDur = 6
	let dDur = cDur
	let eDur = 1
	let fDur = 4

	let a = new Task("a", aDur)
	let b = new Task("b", bDur, [a])
	let c = new Task("c", cDur, [b])
	let d = new Task("d", dDur, [b])
	let e = new Task("e", eDur, [c,d])
	let f = new Task("f", fDur, [e])

	schedule.addTasks([a,b,c,d,e,f])
	schedule.calc()
	let cp = schedule.criticalPath()

	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
})