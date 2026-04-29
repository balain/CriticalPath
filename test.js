const test = require('ava')

const Schedule = require('./schedule')
const Task = require('./task')
const { addBusinessDays, workingDaysBetween, workingDaysFromNow } = require('./dateExtension')

function getRandomSingleDigitNonZeroInt() {
	return getRandomInt(1, 10) // [1, 9] inclusive
}

function getRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min) + min) // max is exclusive
}

function sumDurations(durs) {
	return durs.reduce((a, b) => a + b, 0)
}

// ─── Schedule / Task basics ──────────────────────────────────────────────────

test('schedule-toString', t => {
	const schedule = new Schedule()
	schedule.addTask(new Task('a', 10))
	t.is(schedule.toString(), 'Schedule: Task count: 1')
})

test('task-to-string', t => {
	const task = new Task('a', 10)
	t.is(
		task.toString(),
		`Task: a: Dur: 10; ES: 0; EF: 0; LS: Infinity; LF: Infinity; Pred count: 0; Succ count: 0`
	)
})

test('pred-succ-errors', t => {
	const a = new Task('a', 3)
	const b = new Task('b', 10)
	t.throws(() => { a.addSucc('b') }, { instanceOf: TypeError })
	t.throws(() => { b.addPred('a') }, { instanceOf: TypeError })
})

test('pred-succ-setting', t => {
	const a = new Task('a', 3)
	const b = new Task('b', 10)
	b.setPreds(a)
	t.true(b.preds.includes(a))
	t.true(a.succs.includes(b))
})

// ─── Single Critical Path ─────────────────────────────────────────────────────

/*
 * a - b - c
 */
test('single-cp-simple-short-single-channel', t => {
	const schedule = new Schedule()

	const aDur = getRandomSingleDigitNonZeroInt()
	const bDur = getRandomSingleDigitNonZeroInt()
	const cDur = getRandomSingleDigitNonZeroInt()

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])

	schedule.addTasks([a, b, c])
	schedule.calc()
	const cp = schedule.criticalPath()
	t.is(cp.tasks.length, 3)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur]))
})

/*
 * a - b - c - d - e - f
 */
test('single-cp-simple-long-single-channel', t => {
	const schedule = new Schedule()

	const aDur = getRandomSingleDigitNonZeroInt()
	const bDur = getRandomSingleDigitNonZeroInt()
	const cDur = getRandomSingleDigitNonZeroInt()
	const dDur = getRandomSingleDigitNonZeroInt()
	const eDur = getRandomSingleDigitNonZeroInt()
	const fDur = getRandomSingleDigitNonZeroInt()

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [c])
	const e = new Task('e', eDur, [d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()
	const cp = schedule.criticalPath()

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
 * a - b - d - e - f
 *       \   /
 *         c      (cDur > dDur, so CP goes through c)
 */
test('single-cp-simple-dual-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()
	const cp = schedule.criticalPath()

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
 * a - b - d - e - f
 *       \   /   /
 *         c ----
 */
test('single-cp-simple-alt-dual-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [c, e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()
	const cp = schedule.criticalPath()

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
 * a - b - d - e - g - h - j - l
 *       \   /   /   \       /
 *         c - f       i - k
 *
 * CP: a - b - c - f - g - i - k - l
 */
test('single-cp-complex-dual-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1
	const fDur = 4, gDur = 7, hDur = 1, iDur = 5, jDur = 3, kDur = 8, lDur = 2

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [c])
	const g = new Task('g', gDur, [e, f])
	const h = new Task('h', hDur, [g])
	const i = new Task('i', iDur, [g])
	const j = new Task('j', jDur, [h])
	const k = new Task('k', kDur, [i])
	const l = new Task('l', lDur, [j, k])

	schedule.addTasks([a, b, c, d, e, f, g, h, i, j, k, l])
	schedule.calc()
	const cp = schedule.criticalPath()

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
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, fDur, gDur, iDur, kDur, lDur]))
})

/*
 * a - b - c - e
 *       \   /   \
 *         d - f - h - i
 *           \   /
 *             g
 *
 * CP: a - b - d - g - h - i
 */
test('single-cp-simple-triple-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1
	const fDur = 4, gDur = 7, hDur = 1, iDur = 5

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [d])
	const g = new Task('g', gDur, [d])
	const h = new Task('h', hDur, [e, f, g])
	const i = new Task('i', iDur, [h])

	schedule.addTasks([a, b, c, d, e, f, g, h, i])
	schedule.calc()
	const cp = schedule.criticalPath()

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
	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur, iDur]))
})

test('single-cp-moderate-triple-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1, fDur = 4
	const gDur = 7, hDur = 1, iDur = 5, jDur = 3, kDur = 8, lDur = 2
	const mDur = 1, nDur = 5, oDur = 3, pDur = 6, qDur = 4, rDur = 8, sDur = 1

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [d])
	const g = new Task('g', gDur, [d])
	const h = new Task('h', hDur, [e, f, g])
	const i = new Task('i', iDur, [h])
	const j = new Task('j', jDur, [h])
	const k = new Task('k', kDur, [i])
	const l = new Task('l', lDur, [i])
	const m = new Task('m', mDur, [j])
	const n = new Task('n', nDur, [k, l])
	const o = new Task('o', oDur, [m])
	const p = new Task('p', pDur, [n])
	const q = new Task('q', qDur, [p])
	const r = new Task('r', rDur, [p, o])
	const s = new Task('s', sDur, [q, r])

	schedule.addTasks([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s])
	schedule.calc()
	const cp = schedule.criticalPath()

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
	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur, iDur, kDur, nDur, pDur, rDur, sDur]))
})

// ─── Dual Critical Path ───────────────────────────────────────────────────────

/*
 * a - b - d - e - f      (cDur == dDur, so both paths are critical)
 *       \   /
 *         c
 */
test('dual-cp-simple-dual-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = cDur, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()
	const cp = schedule.criticalPath()

	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
})

/*
 * a - b - d - e - g - h - j - l
 *       \   /   /   \       /
 *         c - f       i - k
 *
 * CPs: a-b-c-e-g-i-k-l  and  a-b-c-f-g-i-k-l
 */
test('dual-cp-complex-dual-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 4
	const fDur = 4, gDur = 7, hDur = 1, iDur = 5, jDur = 3, kDur = 8, lDur = 2

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [c])
	const g = new Task('g', gDur, [e, f])
	const h = new Task('h', hDur, [g])
	const i = new Task('i', iDur, [g])
	const j = new Task('j', jDur, [h])
	const k = new Task('k', kDur, [i])
	const l = new Task('l', lDur, [j, k])

	schedule.addTasks([a, b, c, d, e, f, g, h, i, j, k, l])
	schedule.calc()
	const cp = schedule.criticalPath()

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
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, fDur, gDur, iDur, kDur, lDur]))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, gDur, iDur, kDur, lDur]))
})

test('dual-cp-moderate-triple-channel', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = 2, eDur = 1, fDur = 4
	const gDur = 7, hDur = 1, iDur = 5, jDur = 6, kDur = 8, lDur = 2
	const mDur = 6, nDur = 5, oDur = 12, pDur = 6, qDur = 4, rDur = 8, sDur = 1

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [d])
	const g = new Task('g', gDur, [d])
	const h = new Task('h', hDur, [e, f, g])
	const i = new Task('i', iDur, [h])
	const j = new Task('j', jDur, [h])
	const k = new Task('k', kDur, [i])
	const l = new Task('l', lDur, [i])
	const m = new Task('m', mDur, [j])
	const n = new Task('n', nDur, [l])
	k.setSuccs([n])
	const o = new Task('o', oDur, [m])
	const p = new Task('p', pDur, [n])
	const q = new Task('q', qDur, [p])
	const r = new Task('r', rDur)
	r.addPred(p)
	o.setSuccs(r)
	const s = new Task('s', sDur, [q, r])

	schedule.addTasks([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s])
	schedule.calc()
	const cp = schedule.criticalPath()

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
	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur, iDur, kDur, nDur, pDur, rDur, sDur]))
	t.is(cp.duration, sumDurations([aDur, bDur, dDur, gDur, hDur, jDur, mDur, oDur, rDur, sDur]))

	schedule.calcCriticalPaths()
	t.is(schedule.countCriticalPaths(), 2)

	const criticalPaths = schedule.criticalPaths
	t.is(criticalPaths[0].join('-'), `a-b-d-g-h-i-k-n-p-r-s`)
	t.is(criticalPaths[1].join('-'), `a-b-d-g-h-j-m-o-r-s`)
})

// ─── Head / Tail tasks ────────────────────────────────────────────────────────

test('getHeadAndTailTasks', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = cDur, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()

	t.deepEqual(schedule.getHeadTasks(), [a])
	t.deepEqual(schedule.getTailTasks(), [f])
})

// ─── Multiple head / tail tasks ───────────────────────────────────────────────

test('multiple-head-tasks', t => {
	const schedule = new Schedule()
	// Two parallel starts: a (shorter) and b (longer), converging at c
	const a = new Task('a', 3)
	const b = new Task('b', 5)
	const c = new Task('c', 2, [a, b])
	const d = new Task('d', 4, [c])

	schedule.addTasks([a, b, c, d])
	schedule.calc()
	const cp = schedule.criticalPath()

	// CP goes through b (the longer head) → c → d
	t.false(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.is(cp.duration, 5 + 2 + 4)
})

test('multiple-tail-tasks', t => {
	const schedule = new Schedule()
	// One start splitting into two chains with different lengths
	const a = new Task('a', 5)
	const b = new Task('b', 3, [a])
	const c = new Task('c', 7, [a])

	schedule.addTasks([a, b, c])
	schedule.calc()
	const cp = schedule.criticalPath()

	t.true(cp.tasks.includes(a))
	t.false(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.is(cp.duration, 5 + 7)
})

// ─── calc() idempotency ───────────────────────────────────────────────────────

test('calc-is-idempotent', t => {
	const schedule = new Schedule()
	const a = new Task('a', 3)
	const b = new Task('b', 5, [a])
	schedule.addTasks([a, b])

	schedule.calc()
	const dur1 = schedule.criticalPath().duration
	const len1 = schedule.criticalPath().tasks.length

	schedule.calc()
	const dur2 = schedule.criticalPath().duration
	const len2 = schedule.criticalPath().tasks.length

	t.is(dur1, dur2)
	t.is(len1, len2)
})

// ─── Count / print multiple critical paths ────────────────────────────────────

test('count-multiple-critical-paths', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = cDur, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()

	t.is(schedule.countCriticalPaths(), 2)
})

test('print-multiple-critical-paths', t => {
	const schedule = new Schedule()

	const aDur = 5, bDur = 3, cDur = 6, dDur = cDur, eDur = 1, fDur = 4

	const a = new Task('a', aDur)
	const b = new Task('b', bDur, [a])
	const c = new Task('c', cDur, [b])
	const d = new Task('d', dDur, [b])
	const e = new Task('e', eDur, [c, d])
	const f = new Task('f', fDur, [e])

	schedule.addTasks([a, b, c, d, e, f])
	schedule.calc()
	const cp = schedule.criticalPath()

	t.is(cp.tasks.length, 6)
	t.true(cp.tasks.includes(a))
	t.true(cp.tasks.includes(b))
	t.true(cp.tasks.includes(c))
	t.true(cp.tasks.includes(d))
	t.true(cp.tasks.includes(e))
	t.true(cp.tasks.includes(f))
	t.is(cp.duration, sumDurations([aDur, bDur, cDur, eDur, fDur]))
})

// ─── dateExtension ────────────────────────────────────────────────────────────

test('addBusinessDays-zero-days', t => {
	const monday = new Date('2024-01-08') // Monday
	const result = addBusinessDays(monday, 0)
	t.is(result.getDay(), 1) // still Monday
	t.is(result.getDate(), 8)
})

test('addBusinessDays-across-one-weekend', t => {
	const friday = new Date('2024-01-05') // Friday
	const result = addBusinessDays(friday, 1)
	t.is(result.getDay(), 1) // Monday
	t.is(result.getDate(), 8)
})

test('addBusinessDays-two-weeks', t => {
	const monday = new Date('2024-01-08') // Monday Jan 8
	const result = addBusinessDays(monday, 10)
	t.is(result.getDay(), 1) // Monday
	t.is(result.getDate(), 22) // Jan 22
})

test('addBusinessDays-saturday-input-adjusts', t => {
	const saturday = new Date('2024-01-06') // Saturday
	// Silently advance to Monday then add 0 days
	const result = addBusinessDays(saturday, 0, true)
	t.is(result.getDay(), 1) // Monday
})

test('workingDaysBetween-same-day', t => {
	const d = new Date('2024-01-08')
	t.is(workingDaysBetween(d, d), 0)
})

test('workingDaysBetween-one-week', t => {
	const mon = new Date('2024-01-08')
	const nextMon = new Date('2024-01-15')
	t.is(workingDaysBetween(mon, nextMon), 5)
})

test('workingDaysBetween-one-day', t => {
	const mon = new Date('2024-01-08')
	const tue = new Date('2024-01-09')
	t.is(workingDaysBetween(mon, tue), 1)
})

test('workingDaysBetween-invalid-reversed', t => {
	const future = new Date('2024-01-15')
	const past = new Date('2024-01-08')
	t.is(workingDaysBetween(future, past), -1)
})

test('workingDaysFromNow-past-returns-negative', t => {
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	t.is(workingDaysFromNow(yesterday), -1)
})
