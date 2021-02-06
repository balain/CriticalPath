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

		this.es = -1
		this.ef = -1
		this.ls = 9999
		this.lf = 9999
	}

	toString() {
		return(`Task: ${this.id}: Start: ${this.start}; Dur: ${this.duration}; ES: ${this.es}; EF: ${this.ef}; LS: ${this.ls}; LF: ${this.lf}; Pred count: ${this.preds.length}; Succ count: ${this.succs.length}`)
	}

	setSuccs(s) {
		debug(`${this.id}: setSuccs(${s.id}) - typeof: ${typeof s}`)
		if ((typeof s == 'string') || (typeof s == 'number')) {
			this.addPred(s)
		} else if (typeof s == 'object') {
			debug(`...adding ${p.id}`)
			s.forEach((succ) => {
				this.addSucc(succ)
			})
		}
	}
	
	addSucc(t) { 
		debug(`${this.id}: addSucc(${t.id})...`)
		this.succs.push(t)
		if (!t.preds.includes(this)) {
			t.preds.push(this)
		}
	}
	
	setPreds(p) {
		debug(`${this.id}: typeof: ${typeof p}`)
		if ((typeof p == 'string') || (typeof p == 'number')) {
			debug(`...setPreds(${p})`)
			this.addPred(p)
		} else if (p instanceof Task) {
			debug(`...setPreds(${p.id})`)
			this.addPred(p)
		} else if (typeof p == 'object') {
			p.forEach((pred) => {
				debug(`...setPreds(${p.id})`)
				this.addPred(pred)
			})
		}
	}

	addPred(t) {
		debug(`${this.id}: addPred(${t.id})...`)
		this.preds.push(t)
		if (!t.succs.includes(this)) {
			t.succs.push(this)
		}
	}
}

module.exports = Task
