import React, { Component } from 'react';
import './App.css';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import TextField from '@material-ui/core/TextField';
import AppBar from '@material-ui/core/AppBar';
//import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';


const muiTheme = createMuiTheme({});
var rank = 1;

class Main extends Component{
  render(){
    return(
      <MuiThemeProvider theme={muiTheme}>
        <CAppBar/>
        <CSearch/>
        <CTopTable/>
      </MuiThemeProvider>
    );
  }
}

class CSearch extends Component{
  state = {
    search: {
      query: ''
    },
    results: []
  }

  searchdb = (event) => {
    if(event.keyCode === 13 && this.state.search.query !== ''){
            fetch('http://localhost:4000/zedder/search?query='+this.state.search.query)
              .then(response => response.json())
              .then(response => this.setState({ results: response.data}))
              .catch(err => console.error(err));
    }
  }

  checkInput = (e) => {
    this.setState({ search: {query: e.target.value.replace(/[^0-9a-z]/gi, '')}});
    if(this.state.results.length !== 0)
      this.setState({results: []});
  }

  render(){
    const { search, results } = this.state;
    return(
      <div className="Search">
        <TextField
          id="search"
          label="Search NetID"
          type="search"
          margin="normal"
          fullWidth
          value={search.query}
          onChange={this.checkInput}
          onKeyDown={this.searchdb}
        />
        <ReactCSSTransitionGroup transitionName="SearchResults" transitionAppear={true} transitionAppearTimeout={500} transitionEnterTimeout={500} transitionEnter={true} transitionLeave={true} transitionLeaveTimeout={500}>
          {results.length > 0 &&
            <Paper>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <p key="results">{search.query} covered {results[0].count} shift(s)</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          }
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

class CAppBar extends Component{
  render(){
    return(
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="title" color="inherit">
            Zedder
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

class CTopTable extends Component {

  state = {
    shifts: []
  }

  componentDidMount(){
    this.getShifts();
  }

  getShifts = _ => {
    fetch('http://localhost:4000/zedder')
      .then(response => response.json())
      .then(response => this.setState({ shifts: response.data}))
      .catch(err => console.error(err))
  }

  renderShifts = ({covered, count}) => (
    <TableRow key={rank}>
      <TableCell className="TableRank TCell">{rank++}</TableCell>
      <TableCell className="TableCovered TCell">{covered}</TableCell>
      <TableCell numeric className="TableCount TCell">{count}</TableCell>
    </TableRow>
  );

  render() {
    const { shifts } = this.state
    return (
      <div>
        {shifts.length > 0 &&
        <ReactCSSTransitionGroup transitionName="TableAnim" transitionAppear={true} transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionEnter={false} transitionLeave={false}>
          <Typography variant="headline" color="default" align="center">
            All Time
          </Typography>
          <Paper className="Top10Table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell numeric>Coverages</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map(this.renderShifts)}
              </TableBody>
            </Table>
          </Paper>
        </ReactCSSTransitionGroup>
      }
      </div>
    );
  }
}

export default Main;
