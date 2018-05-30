const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'zedder',
	password: 'zeddershredder',
	database: 'zedder'
});
connection.connect(err => {
	if(err)
		return err;
});

app.use(cors());

app.get('/', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.send('Hello from API');
});

const selectAll = "SELECT covered, COUNT(covered) AS count FROM Data WHERE covered<>'Open' GROUP BY covered ORDER BY count DESC limit 10"
var queries = new Array(3);
var date = new Date();

app.get('/zedder', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	/*var date = new Date();
	const startMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
	var d_startWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
	d_startWeek.setDate(d_startWeek.getDate() + 1);
	const startWeek = d_startWeek.toISOString().split('T')[0];*/
	const backMonth = date.getDate();
	const backWeek = date.getDay()+1;

	queries[0] = selectAll;
	queries[1] = "SELECT covered, COUNT(covered) AS count \
								FROM Data \
								WHERE (covered<>'Open' AND coveredTime BETWEEN CURDATE() - INTERVAL " + backMonth + " DAY AND CURDATE())\
								GROUP BY covered ORDER BY count DESC limit 10";
	queries[2] = "SELECT covered, COUNT(covered) AS count \
								FROM Data \
								WHERE (covered<>'Open' AND coveredTime BETWEEN CURDATE() - INTERVAL " + backWeek + " DAY AND CURDATE())\
								GROUP BY covered ORDER BY count DESC limit 10";

	var arrResults = new Array(3);
	querydb(0);

	function querydb(index){
		if(index < 3){
			connection.query(queries[index], (err, results) => {
				if(err)
					return res.send(err);
				else{
					for(row in results){
						var covered = results[row].covered;
						if(!(covered === "Open"))
							results[row].covered = covered.substring(0, covered.length-3).replace(/[0-9]/g, '');;
					}
					arrResults[index] = results;
				}
				querydb(index+1);
			});
		}
		else{
			return res.json({
				allTime: arrResults[0],
				month: arrResults[1],
				week: arrResults[2]
			});
		}
	}
});

app.get('/zedder/search', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	var{query} = req.query;
	query = query.replace(/[^0-9a-z]/gi, '');
	connection.query(
		"SELECT covered, COUNT(covered) AS count FROM Data WHERE (covered<>'Open' AND covered='"+ query +"') LIMIT 1",
		(err, results) => {
			if(err)
				return res.send(err);
			else{
				results[0].covered = query;
				return res.json({
					data: results
				});
		}
	});
});

var port = 4000;

app.listen(port, () => {
	console.log('API Server is listening on ' + port)
});
