/* Code based on
 * https://www.pmi.org/learning/library/critical-path-method-calculations-scheduling-8040
 */

const debug = require('debug')('schedule')
const Task = require('./task')

class Schedule {
	constructor() {
		this.tasks = []
		this.calculated = false
	}

	addTasks(taskArray) {
		taskArray.forEach((t) => {
			this.addTask(t)
		})
	}

	addTask(task) {
		this.tasks.push(task)
	}

	toString() {
		return(`Schedule: Task count: ${this.tasks.length}`)
	}

	calc() {
		debug(`calc() called`)

		// Reset state so calc() is idempotent
		this.tasks.forEach(t => {
			t.es = 0
			t.ef = 0
			t.ls = Infinity
			t.lf = Infinity
			t.tf = undefined
			t.ff = undefined
		})
		this.calculated = false

		// Forward pass using Kahn's topological sort — handles multiple head tasks
		// and eliminates recursion depth limits
		const topoOrder = this._forwardPass()

		// Backward pass in reverse topological order — handles multiple tail tasks
		this._backwardPass(topoOrder)

		this.tasks.forEach(t => {
			this._calcTF(t)
			this._calcFF(t)
		})

		this._sanityCheck()
		this.calculated = true
	}

	_forwardPass() {
		const inCount = new Map(this.tasks.map(t => [t, t.preds.length]))
		const queue = this.tasks.filter(t => t.preds.length === 0)
		const order = []

		while (queue.length > 0) {
			const t = queue.shift()
			t.ef = t.es + t.duration
			order.push(t)

			t.succs.forEach(s => {
				if (t.ef > s.es) s.es = t.ef
				inCount.set(s, inCount.get(s) - 1)
				if (inCount.get(s) === 0) queue.push(s)
			})
		}

		if (order.length !== this.tasks.length) {
			throw new Error('Cycle detected in task graph')
		}

		return order
	}

	_backwardPass(topoOrder) {
		const projectEnd = Math.max(...this.tasks.map(t => t.ef))

		for (let i = topoOrder.length - 1; i >= 0; i--) {
			const t = topoOrder[i]
			t.lf = t.succs.length === 0
				? projectEnd
				: Math.min(...t.succs.map(s => s.ls))
			t.ls = t.lf - t.duration
		}
	}

	_calcTF(t) {
		t.tf = t.ls - t.es
	}

	_calcFF(t) {
		debug(`_calcFF(${t.id})...`)
		if (!t.succs.length) {
			t.ff = 0
			return
		}
		t.ff = Math.min(...t.succs.map(s => s.es)) - t.ef
	}

	_sanityCheck() {
		this.tasks.forEach((t) => {
			if (t.ff > t.tf) {
				throw new Error(`ERROR with ${t.id}: FreeFloat (${t.ff}) > TotalFloat (${t.tf})`)
			}
			if (t.es < 0) { throw new Error(`Invalid (negative) value: t.es == ${t.es}`) }
			if (t.ef < 0) { throw new Error(`Invalid (negative) value: t.ef == ${t.ef}`) }
			if (t.ls < 0) { throw new Error(`Invalid (negative) value: t.ls == ${t.ls}`) }
			if (t.lf < 0) { throw new Error(`Invalid (negative) value: t.lf == ${t.lf}`) }
		})
		debug(`Sanity Check passed!`)
	}

	getLatestTask() {
		debug(`getLatestTask() called`)
		let efVal = -1
		let lt
		this.tasks.forEach((t) => {
			if (t.ef > efVal) {
				efVal = t.ef
				lt = t
			}
		})

		if (lt instanceof Task) {
			return lt
		} else {
			throw new TypeError(`lt isn't a Task; it's a ${typeof lt}`)
		}
	}

	getHeadTasks() {
		if (!this.calculated) this.calc()
		return this.tasks.filter(t => t.ff === 0 && t.tf === 0 && t.preds.length === 0)
	}

	getTailTasks() {
		if (!this.calculated) this.calc()
		return this.tasks.filter(t => t.ff === 0 && t.tf === 0 && t.succs.length === 0)
	}

	criticalPath() {
		if (!this.calculated) this.calc()
		let criticalPathTasks = []
		let dur = -1

		this.tasks.forEach((t) => {
			if (t.ff === 0 && t.tf === 0) {
				criticalPathTasks.push(t)
				if (t.lf > dur) { dur = t.lf }
			}
		})
		return({ tasks: criticalPathTasks, duration: dur })
	}

	calcCriticalPaths() {
		if (!this.calculated) this.calc()
		this.criticalPaths = []
		this.getHeadTasks().forEach(t => this.walkCP(t, [t]))
	}

	walkCP(task, path) {
		const critSuccs = task.succs.filter(s => s.tf === 0 && s.ff === 0)
		if (!critSuccs.length) {
			this.criticalPaths.push(path.map(t => t.id))
		} else {
			critSuccs.forEach(s => this.walkCP(s, [...path, s]))
		}
	}

	countCriticalPaths() {
		if (!this.criticalPaths) this.calcCriticalPaths()
		return this.criticalPaths.length
	}
}

module.exports = Schedule
