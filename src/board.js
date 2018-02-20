
import React from 'react';
import PropTypes from 'prop-types';
import './board.css';
import FontAwesome from 'react-fontawesome';


class Board extends React.Component {
  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.string,
    isActive: PropTypes.bool,
    isMultiplayer: PropTypes.bool,
    isConnected: PropTypes.bool,
  };

  onClick = id => {
    if (this.isActive(id)) {
      this.props.moves.placeTile(id, prompt("Enter letter"));
    }
  };

  isActive(id) {
    if (!this.props.isActive) return false;
    if (this.props.G.cells[id] !== null) return false;
    return true;
  }

  render() {
    let tbody = [];
    for (let i = 0; i < 22; i++) {
      let cells = [];
      for (let j = 0; j < 22; j++) {
        const id = 22 * i + j;

        let star = '';

        if (!this.props.G.cells[id]){
        if ([1, 9, 12, 20].includes(i) && [1, 9, 12, 20].includes(j)){
          star = <FontAwesome name="star" />;
        }

        if ([5, 16].includes(i) && [5, 16].includes(j)){
          star = <FontAwesome name="certificate" />;
        }
      }


        cells.push(
          <td
            key={id}
            className={this.isActive(id) ? 'active' : ''}
            onClick={() => this.onClick(id)}
          >
            {this.props.G.cells[id]}
            {star}

          </td>
        );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    let disconnected = null;
    if (this.props.isMultiplayer && !this.props.isConnected) {
      disconnected = <div>Disconnected!</div>;
    }

    let winner = null;
    if (this.props.ctx.gameover !== undefined) {
      winner = <div id="winner">Winner: {this.props.ctx.gameover}</div>;
    }

    let player = null;
    if (this.props.playerID !== null) {
      player = <div id="player">Player: {this.props.playerID}</div>;
    }

    return (
      <div>
        <table id="board">
          <tbody>{tbody}</tbody>
        </table>
        {player}
        <div>Hand: {JSON.stringify(this.props.G.players[this.props.playerID].tiles)}</div>
        {winner}
        {disconnected}
        <div>Remaining: {this.props.G.remainingTiles}</div>

        <div className="buttons">
          <button onClick={() => this.props.events.endTurn()}>endTurn</button>
          <button onClick={() => this.props.moves.dumpTiles()}>Dump Tiles</button>
        </div>

      </div>
    );
  }
}

export default Board;


 /*<div>Tiles: {JSON.stringify(this.props.G.nonsecret)}</div>*/




