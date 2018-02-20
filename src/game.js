
import { Game, PlayerView } from 'boardgame.io/core';
//import { Random } from 'boardgame.io/core';

function IsVictory(cells) {
  return false;
}





function GetTiles() {

  let tiles = [];

  const tilecounts = {
    'A':15, 'B': 4, 'C': 3,
    'D': 6, 'E':20, 'F': 3,
    'G': 5, 'H': 3, 'I':14,
    'J': 1, 'K': 1, 'L': 6,
    'M': 5, 'N': 9, 'O':11,
    'P': 4, 'Q': 1, 'R': 9,
    'S': 7, 'T': 9, 'U': 5,
    'V': 1, 'W': 2, 'X': 1,
    'Y': 1, 'Z': 1, ' ': 0,
  };

  // TODO: implement blanks (should be 3)

  for (let tile in tilecounts) {

    for (let i = 0; i < tilecounts[tile]; i++) {
      tiles.push(tile);
    }
  }


  //return Random.D6(G, 'diceValue');
  return shuffle(tiles);
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function drawTiles(G, ctx) {
  for (let i = G.players[ctx.currentPlayer].tiles.length; i < 7; i++) {
    G.players[ctx.currentPlayer].tiles.push(G.secret.shift());
  }

  G.remainingTiles = G.secret.length;
  G.turnOver = false
  return { ...G };
}

const Questique = Game({
  name: 'questique',

  setup: (numPlayers) => {

    let tiles = GetTiles();

    let s = {
      cells: Array(22*22).fill(null),
      players: {},
      secret: tiles,
      turnOver: false,
    };

    for (let p = 0; p < numPlayers; p++) {
      s.players[p] = { tiles: [] };
      for (let i = 0; i < 7; i++) {
        s.players[p].tiles.push(tiles.shift());
      }
    }

    s.remainingTiles = tiles.length

    return s;
  },

  moves: {
    placeTile(G, ctx, id, tile) {
      const cells = [...G.cells];

      // make sure the square is not already taken
      if (cells[id] != null) {
        alert('You cannot place a tile on a square that already has a tile');
        return G
      }

      // FIXME: make sure the square is not touching another players tiles

      // FIXME: make sure the square is touching the current players tiles

      // convert letter to upper case and only take the first letter
      tile = tile.toUpperCase()[0];

      // make sure the player has the tile in their hand
      let idx = G.players[ctx.currentPlayer].tiles.indexOf(tile);
      if (idx === -1){
        alert('You cannot place a tile you dont have in your hand');
        return G
      }

      // place the tile on the board and remove it from the players hand
      cells[id] = G.players[ctx.currentPlayer].tiles.splice(idx, 1);

      return { ...G, cells };
    },

    dumpTiles(G, ctx) {

      // put all my tiles back into the bag
      // FIXME: these should be put back in some sort of random order
      while (G.players[ctx.currentPlayer].tiles.length > 0){
        G.secret.push(G.players[ctx.currentPlayer].tiles.pop());
      }
      G.turnOver = true;
      //G.events.endTurn();
      return { ...G };
    },


  },

  playerView: PlayerView.STRIP_SECRETS,

  flow: {
    //movesPerTurn: 8,

    endGameIf: (G, ctx) => {
      if (IsVictory(G.cells)) {
        return ctx.currentPlayer;
      }
    },


    endTurnIf: (G, ctx) => {
      if (G.turnOver) {
        return true;
      }
    },

    onTurnEnd: (G, ctx) => {
      return drawTiles(G, ctx);
    },

  },



});

export default Questique;
