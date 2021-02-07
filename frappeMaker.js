const debug = require('debug')('frappeMaker')

const Schedule = require('./schedule')
const fs = require('fs')
const dateExtension = require('./dateExtension')

const prefix = `<!DOCTYPE html>
<html>
<head>
	<title>Gantt Critical Path Demo - Frappe</title>
	<script type="text/javascript" src="./js/frappe-gantt.js"></script>
	<!-- script type="text/javascript" src="./js/frappe-gantt.min.js"></script -->
	<link rel="stylesheet" type="text/css" href="./css/frappe-gantt.css">
	<link rel="stylesheet" type="text/css" href="./css/critical_path.css">
</head>
<body>
<div id="gantt">Test</div>
<script type="text/javascript">
var xtasks = [
	{
		id: 'Task 1',
		name: 'first task',
		start: '2021-02-07',
		end: '2021-03-01',
		progress: 10,
		dependencies: 'Task 2, Task 3'
	},
	{
		id: 'Task 2',
		name: 'second task',
		start: '2021-03-07',
		end: '2021-03-10',
		progress: 10,
		dependencies: ''
	},
	{
		id: 'Task 3',
		name: 'third task',
		start: '2021-03-07',
		end: '2021-03-15',
		progress: 10,
		dependencies: ''
	},
]
`

const suffix = `
var gantt = new Gantt("#gantt", tasks, { view_mode: 'Day', date_format: 'YYYY-MM-DD', view_modes: ['Day', 'Week', 'Month']})
</script>
</body>
</html>`

function getDependencies(task) {
	debug(`getDependencies(${task.id}) returning: ${task.preds.map(t => t.id)}`)
	return(task.preds.map(t => t.id).join(','))
}

class frappeGanttMaker {
	constructor() {}

	saveTaskListToGantt(schedule, filename = 'index.html') {
		debug(`Saving task list to Gantt chart...`)
		let html = []
		let tasks = []

		let now = new Date()
		now.setHours(0,0,0,0)
		html.push(prefix)
		schedule.tasks.forEach((task) => {
			let deps = getDependencies(task)
			let customClass = task.tf == 0 && task.ff == 0 ? 'critical' : ''
			debug(`setting customClass for ${task.id} to ${customClass}!`)

			tasks.push(JSON.stringify({ id: task.id, name: task.id, start: now.addBusinessDays(task.es), end: now.addBusinessDays(task.es + task.duration - 1, true), progress: 0, dependencies: deps, custom_class: customClass }))
		})
		html.push(`var tasks = [${tasks.join(',')}]`)
		html.push(suffix)
		fs.writeFileSync('./output/' + filename, html.join(''))
		debug(`...done`)
	}	
}

module.exports = frappeGanttMaker
