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
		// Calc ES and EF
		this._forward(this.tasks[0], 0)
		// Calc LS and LF
		let latestTask = this.getLatestTask()
		this._backward(latestTask, latestTask.ef)
		// Now calc TF and FF
		this.tasks.forEach((t) => {
			this._calcTF(t)
			this._calcFF(t)
		})
		this._sanityCheck() // Throw Error if any problems are found
		this.calculated = true
	}

	_calcTF(t) {
		t.tf = t.ls - t.es
	}

	_calcFF(t) {
		debug(`_calcFF(${t.id})...`)
		let lowestES = 999
		if (t.succs.length) {
			t.succs.forEach((s) => {
				if (s.es < lowestES) {
					debug(`...setting t.ff to ${s.es - t.ef}`)
					t.ff = s.es - t.ef
					lowestES = s.es
				}
			})
		} else {
			debug(`...no successors; setting FF to 0`)
			t.ff = 0
		}
	}

	_forward(t, es) {
		// Calculate ES EF
		debug(`_forward(${t.id}, ${es} > ${t.es}?)`)
		t.es = es > t.es ? es : t.es
		t.ef = t.es + t.duration
		t.succs.forEach((s) => {
			this._forward(s, t.ef)
		})
	}

	_backward(t, lf) {
		// Calculate LS LF
		debug(`_backward(${t.id}, ${lf} < ${t.lf}?)`)
		t.lf = lf < t.lf ? lf : t.lf
		t.ls = t.lf - t.duration
		t.preds.forEach((p) => {
			this._backward(p, t.ls)
		})
	}

	_sanityCheck() {
		// Verify all FF <= TF
		this.tasks.forEach((t) => {
			if (t.ff > t.tf) {
				throw new Error(`ERROR with ${t.id}: FreeFloat (${t.ff}) > TotalFloat (${t.tf})`)
			}
			if (t.es < 0) { throw new Error(`Invalid (negative) value: t.es == ${t.es}`)}
			if (t.ef < 0) { throw new Error(`Invalid (negative) value: t.ef == ${t.ef}`)}
			if (t.ls < 0) { throw new Error(`Invalid (negative) value: t.ls == ${t.ls}`)}
			if (t.lf < 0) { throw new Error(`Invalid (negative) value: t.lf == ${t.lf}`)}
		})
		debug(`Sanity Check passed!`)
	}

	getLatestTask() {
		debug(`getLatestTask() called`)
		let efVal = -1
		let lt
		this.tasks.forEach((t) => {
			debug(`...checking ${t.id}: t.lf (${t.ef}) > efVal (${efVal})`)
			if (t.ef > efVal) {
				debug(`...yes`)
				efVal = t.ef
				lt = t
			}
		})

		if (lt instanceof Task) {
			debug(`...glt/ Setting lt.lf to lt.ef == ${lt.ef}`)
			lt.lf = lt.ef
		} else {
			throw new TypeError(`lt isn't a Task; it's a ${typeof lt}`)
		}
		debug(`...returning ${lt.id}`)
		return(lt)
	}

	getHeadTasks() {
		return this.tasks.filter(t => t.ff ==0 && t.tf == 0 && t.preds.length == 0)
	}
	
	getTailTasks() {
		return this.tasks.filter(t => t.ff == 0 && t.tf == 0 && t.succs.length == 0)
	}
	
	criticalPath() {
		let criticalPathTasks = []
		let dur = -1

		this.tasks.forEach((t) => {
			if (t.ff == 0 && t.tf == 0) {
				criticalPathTasks.push(t)
				if (t.lf > dur) { dur = t.lf } 
			}
		})
		return({ tasks: criticalPathTasks, duration: dur })
	}
	
	calcCriticalPaths() {
		if (!this.calculated) {
			this.calc()
		}
		this.criticalPaths = []
		this.getHeadTasks().forEach((t) => {
			this.walkCP(t, [t], 0)
		})                               
	}

	walkCP(task, path, level) {
		if (task.succs.length) {
			task.succs.forEach((s) => {
				if (s.tf == 0 && s.ff == 0) {
					// Truncate path to end in task
					path.splice(level+1)
					path.push(s)
					this.walkCP(s, path, level + 1)
				}
			})
		} else {
			this.criticalPaths.push(path.map(t => t.id))
		}
	}

	countCriticalPaths() {
		if (!this.criticalPaths) {
			this.calcCriticalPaths()
		}
		return(this.criticalPaths.length)
	}
}

module.exports = Schedule