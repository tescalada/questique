
import React from 'react';
import { Client } from 'boardgame.io/client';
import Questique from './game';
import Board from './board';

const App = Client({
  game: Questique,
  board: Board,
  debug: true,
  multiplayer: false,
  numPlayers: 1,
});

const Multiplayer = () => (
  <div style={{ padding: 50 }}>
    <h1>Multiplayer</h1>
    <div className="runner">
      <div className="run">
        <App gameID="multi" playerID="0" />
        &lt;App playerID=&quot;0&quot;/&gt;
      </div>
    </div>
  </div>
);

export default Multiplayer;
