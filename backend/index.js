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

app.get('/zedder', (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	connection.query(selectAll, (err, results) => {
		if(err)
			return res.send(err);
		else{
			for(row in results){
				var covered = results[row].covered;
				if(!(covered === "Open"))
					results[row].covered = covered.substring(0, covered.length-3).replace(/[0-9]/g, '');;
			}
			return res.json({
				data: results
			});
		}
	});
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
