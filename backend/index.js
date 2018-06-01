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
var arrResults = new Array(3);
var date = new Date();

app.get('/zedder', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	const backMonth = date.getDate();
	const backWeek = date.getDay()+1;

	queries[0] = selectAll;
	queries[1] = "SELECT covered, COUNT(covered) AS count \
								FROM Data \
								WHERE (covered<>'Open' AND coveredTime BETWEEN NOW() - INTERVAL " + backMonth + " DAY AND NOW())\
								GROUP BY covered ORDER BY count DESC limit 10";
	queries[2] = "SELECT covered, COUNT(covered) AS count \
								FROM Data \
								WHERE (covered<>'Open' AND coveredTime BETWEEN NOW() - INTERVAL " + backWeek + " DAY AND NOW())\
								GROUP BY covered ORDER BY count DESC limit 10";
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

var arrSearchResults = new Array(3);

app.get('/zedder/search', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	const backMonth = date.getDate();
	const backWeek = date.getDay()+1;
	var{query} = req.query;
	query = query.replace(/[^0-9a-z]/gi, '').substring(0,20);

	queries[0] = "SELECT covered, COUNT(covered) AS count FROM Data WHERE (covered<>'Open' AND covered='"+ query +"') LIMIT 1";
	queries[1] = "SELECT covered, COUNT(covered) AS count FROM Data WHERE (covered<>'Open' AND coveredTime BETWEEN NOW() - INTERVAL " + backMonth + " DAY AND NOW() AND covered='"+ query +"') LIMIT 1";
	queries[2] = "SELECT covered, COUNT(covered) AS count FROM Data WHERE (covered<>'Open' AND coveredTime BETWEEN NOW() - INTERVAL " + backWeek + " DAY AND NOW() AND covered='"+ query +"') LIMIT 1";

	querydb(0);

	function querydb(index){
		if(index < 3){
			connection.query(queries[index], (err, results) => {
					if(err)
						return res.send(err);
					else{
						results[0].covered = query;
						arrSearchResults[index] = results;
					}
					querydb(index+1);
			});
		}
		else{
			return res.json({
				allTime: arrSearchResults[0],
				month: arrSearchResults[1],
				week: arrSearchResults[2]
			});
		}
	}
});

var port = 4000;

app.listen(port, () => {
	console.log('API Server is listening on ' + port)
});
