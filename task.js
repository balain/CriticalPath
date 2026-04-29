/* Code based on
 * https://www.pmi.org/learning/library/critical-path-method-calculations-scheduling-8040
 */

const debug = require('debug')('task')

class Task {
	constructor(id, duration, preds = false, succs = false) {
		debug(`constructor called: ${id}, ${duration}`)
		this.id = id
		this.duration = duration
		this.preds = []
		this.succs = []

		if (preds) { this.setPreds(preds) }
		if (succs) { this.setSuccs(succs) }

		this.es = 0
		this.ef = 0
		this.ls = Infinity
		this.lf = Infinity
	}

	toString() {
		return(`Task: ${this.id}: Dur: ${this.duration}; ES: ${this.es}; EF: ${this.ef}; LS: ${this.ls}; LF: ${this.lf}; Pred count: ${this.preds.length}; Succ count: ${this.succs.length}`)
	}

	setSuccs(s) {
		debug(`${this.id}: typeof: ${typeof s}`)
		if (s instanceof Task) {
			debug(`...setSuccs(${s.id})`)
			this.addSucc(s)
		} else if (Array.isArray(s)) {
			s.forEach((succ) => {
				debug(`...setSuccs(${succ.id})`)
				this.addSucc(succ)
			})
		}
	}

	addSucc(t) {
		debug(`${this.id}: addSucc(${t.id})...`)
		if (t instanceof Task) {
			this.succs.push(t)
			if (!t.preds.includes(this)) {
				t.preds.push(this)
			}
		} else {
			throw new TypeError(`Invalid successor type provided: ${typeof t}`)
		}
	}

	setPreds(p) {
		debug(`${this.id}: typeof: ${typeof p}`)
		if (p instanceof Task) {
			debug(`...setPreds(${p.id})`)
			this.addPred(p)
		} else if (Array.isArray(p)) {
			p.forEach((pred) => {
				debug(`...setPreds(${pred.id})`)
				this.addPred(pred)
			})
		}
	}

	addPred(t) {
		debug(`${this.id}: addPred(${t.id})...`)
		if (t instanceof Task) {
			this.preds.push(t)
			if (!t.succs.includes(this)) {
				t.succs.push(this)
			}
		} else {
			throw new TypeError(`Invalid predecessor type provided: ${typeof t}`)
		}
	}
}

module.exports = Task
