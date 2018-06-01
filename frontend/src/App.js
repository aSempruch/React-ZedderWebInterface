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
import CircularProgress from '@material-ui/core/CircularProgress';
import Flexbox from 'flexbox-react';
import icon from 'icon.png';


const muiTheme = createMuiTheme({
  palette: {
    primary: { main: '#1897ad' }, // Purple and green play nicely together.
    secondary: { main: '#0f6a7a' }, // This is just green.A700 as hex.
  },
});

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
    finalResults : ('')
  }

  searchdb = (event) => {
    if(event.keyCode === 13 && this.state.search.query !== ''){
      this.setState({hasSearched: true});
      this.setState({finalResults: (<CircularProgress/>)})
      fetch('http://localhost:4000/zedder/search?query='+this.state.search.query)
        .then(response => response.json())
        .then(response => this.setState({finalResults: (
          <ReactCSSTransitionGroup transitionName="SearchResults" transitionAppear={true} transitionAppearTimeout={500} transitionEnterTimeout={500} transitionEnter={true} transitionLeave={true} transitionLeaveTimeout={500}>
            <Paper>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <p key="results">{this.state.search.query} covered {response.data[0].count} shift(s)</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </ReactCSSTransitionGroup>
        )}))
        .catch(err => console.error(err));
    }
  }

  checkInput = (e) => {
    this.setState({ search: {query: e.target.value.replace(/[^0-9a-z]/gi, '').substring(0, 20)}});
    if(this.state.finalResults !== ('')){
      this.setState({finalResults : ('')});
    }
  }

  render(){
    const { search, finalResults } = this.state;
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
          <Flexbox style={{justifyContent: "center"}}>
            {finalResults}
          </Flexbox>
      </div>
    );
  }
}

class CAppBar extends Component{
  render(){
    return(
      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="title" color="inherit">
            <img src={icon} alt='Zedder'/>
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

class CTopTable extends Component {

  state = {
    alltime: (''),
    month: (''),
    week: (<CircularProgress style={{marginTop: '5%'}}/>)
  }

  componentDidMount(){
    this.getShifts();
  }

  getShifts = _ => {
    fetch('http://localhost:4000/zedder')
      .then(response => response.json())
      .then(response => this.renderTable(response))
      .catch(err => console.error(err))
  }

  renderTable = (response) => {
    var tables = [
      {object: 'week', title: 'Week'},
      {object: 'month', title: 'Month'},
      {object: 'allTime', title: 'All Time'},
    ];

    tables.map((name) =>
      this.setState({[name.object]: (
        <ReactCSSTransitionGroup className="Top10Table" transitionName="AllTimeAnim" transitionAppear={true} transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionEnter={false} transitionLeave={false}>
          <Paper>
            <Typography variant="title" color="primary" align="center" style={{paddingTop: '20px'}}>
              {name.title}
            </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell numeric>Coverages</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {response[name.object].map(this.renderShifts)}
                </TableBody>
              </Table>
            </Paper>
        </ReactCSSTransitionGroup>
      )})
    );
  }

  renderShifts = ({covered, count}, rank) => {
    return(<TableRow key={rank}>
      <TableCell className="TableRank TCell">{rank+1}</TableCell>
      <TableCell className="TableCovered TCell">{covered}</TableCell>
      <TableCell numeric className="TableCount TCell">{count}</TableCell>
    </TableRow>);
  };

  render() {
    const { allTime, month, week } = this.state
    return (
      <div>
        <Typography variant="headline" color="primary" style={{textAlign: 'center', padding:'10px'}}>College Ave</Typography>
          <Flexbox className="Container">
            {week}
            {month}
            {allTime}
          </Flexbox>
      </div>
    );
  }
}

export default Main;
