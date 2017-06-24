import React, { Component } from 'react';
import Grid from './Grid';
import TextEntry from './TextEntry';
import List from './List';

import './App.css';

import { CharNode, ArrayGrid, connectGrid, findMatches as findMatchesGraph,
  Directions } from './wordsearch/search';
import { words, rows } from './wordsearch/data/states';

// TODO: onMouseLeave isn't run sometimes when exiting a node. This causes the
// highlight to remain until another selection is made.

class App extends Component {
  state = {
    // The value of the stuff in the textbox used for inputting a wordsearch.
    textEntry: rows.join('\n'),

    // The requested words to find matches for.
    words: words,

    // An array of words (array of nodes) which are currently selected.
    selected: [],

    // Words in the wordlist which should be brought into focus.
    focused: [],

    grid: null,
  };

  constructor(props) {
    super(props);

    this.buildGraph = this.buildGraph.bind(this);
    this.findMatches = this.findMatches.bind(this);

    this.addSelected = this.addSelected.bind(this);
    this.removeSelected = this.removeSelected.bind(this);

    this.onSelect = this.onSelect.bind(this);
    this.onUnselect = this.onUnselect.bind(this);
  }

  onSelect(...selection) {
    console.log("Selecting", selection.map(selection =>
      selection.map(node => node.khar).join('')
    ).join());

    const focused = selection.map(nodes =>
      nodes.map(node => node.khar).join('')
    );
    this.setState({focused: focused});

    this.addSelected(...selection);
  }

  onUnselect(...selection) {
    console.log("Unselecting", selection.map(selection =>
      selection.map(node => node.khar).join('')
    ).join());

    this.setState({focused: []});
    this.removeSelected(...selection);
  }

  // [a, b, c], [d, e, f]
  addSelected(...selection) {
    if (!selection || !selection.length) {
      return;
    }

    // replace with new selection
    this.setState({selected: selection});
  }

  removeSelected(...selection) {
    if (!selection || !selection.length) {
      return;
    }

    // always clear all selected items
    this.setState({selected: []});
  }

  buildGraph(evt) {
    evt.preventDefault();

    // get rows
    const rows = this.state.textEntry.split(/\r?\n/);

    // create nodes
    const nodeRows = rows.map(row => row
          .split('')
          .map(khar => new CharNode(khar))
    );

    // build and connect grid
    const grid = ArrayGrid.fromArray(nodeRows);
    this.nodes = connectGrid(grid);

    // display grid
    this.setState({grid: grid});
  }

  findMatches(evt) {
    this.matches = findMatchesGraph(this.state.words, this.nodes,
      new Set(Object.keys(Directions)));

    this.setState(prevState => ({grid: prevState.grid.shallowCopy()}));
  }

  selectMatches(word) {
    if (!this.matches) {
      // the matches haven't been found yet
      return;
    }

    const matches = this.matches[word];
    if (!matches) {
      // no match, show some feedback
      return;
    }

    this.addSelected(...matches);
  }

  unSelectMatches(word) {
    if (!this.matches) {
      // the matches haven't been found yet
      return;
    }

    const matches = this.matches[word];
    if (!matches) {
      // no match, show some feedback
      return;
    }

    this.removeSelected(...matches);
  }

  render() {
    console.log("App.render")

    const { grid, words, textEntry, focused } = this.state;

    let results = null;
    if (grid) {
      results = (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            breakBefore: 'page',
          }}>
          <div
            style={{
              maxWidth: '100vmin', // TODO: using vmin here makes long grids to break
              padding: '1em',
              alignSelf: 'center',
              flexBasis: `${grid.columns()}em`,
              flexGrow: 1,
            }}>

            <Grid
              grid={grid}
              selected={this.state.selected}
              onSelect={this.onSelect}
              onUnselect={this.onUnselect} />
          </div>

          <div
            className='WordList'
            style={{
              // TODO: When this element breaks onto a new row, we should set
              // flex-grow 1 so it looks nice on smaller screens
            }}>
            <h3>Words</h3>

            <List
              items={words}
              focused={focused}
              onChange={newItems => this.setState({words: newItems})}
              itemProps={(item) => ({
                onMouseEnter: _ => this.selectMatches(item),
                onMouseLeave: _ => this.unSelectMatches(item),
              })} />

            <div
              style={{margin: '2em'}}>
              <button onClick={this.findMatches}>Find Matches!</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <div className="App-header">
          <h1>Wordsearch Solver</h1>
        </div>

        <p className="App-intro">
          Never solve a word search by hand again, start by entering your puzzle
          in the text box below.
        </p>

        <form
          onSubmit={this.buildGraph}
          className='container'>

          <TextEntry
            minimumRows={5}
            minimumColumns={20}
            value={textEntry}
            onChange={newValue => this.setState({textEntry: newValue})} />

          <button>Build Graph!</button>
        </form>

        { results }
      </div>
    );

    // TODO: Allowed Directions
  }
}

export default App;
