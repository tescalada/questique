#!/usr/bin/env python
from google.appengine.ext import webapp, db
from google.appengine.ext.webapp import util, template
from google.appengine.api import users
import cgi
from models import Game, Tile
import random
import string
import os
from django.utils import simplejson
from time import time
from datetime import datetime

def render_template(response, templateName, values):
    path = os.path.join(os.path.dirname(__file__), templateName)
    return response.out.write(template.render(path, values))

class MainHandler(webapp.RequestHandler):
    def get(self):
        games = Game.all().filter('status =', 'waiting')
        template_values = {
            'games': games,
        }

        render_template(self.response, 
            'templates/index.html', template_values)

class ApiHandler(webapp.RequestHandler):
    ''' handles all api requests, dispatches requests '''
    def get(self,id,action):
        self.response.headers['Content-Type'] = 'application/json'
        gameid = cgi.escape(self.request.get('game'))
        game = Game.get(id)
        out = dict()
        actions = ['placetile','submittiles','tiles']
        if action in actions:
            f = getattr(self, 'do_' + action)
            out = f(game)
        else:
            out = self.fail('invalid action')
        game.save()
        self.response.out.write(simplejson.dumps(out))

    def do_tiles(self, game):
        '''gets the list of tiles played and player scores '''
        out = dict()
        out['timestamp'] = int(time())
        currentplayer = game.currentPlayer()
        out['currentplayer'] = currentplayer.nickname()
        if currentplayer == users.get_current_user():
            out['myturn'] = 1
        tiles = Tile.all().filter('game =', game)
        since = cgi.escape(self.request.get('since'))
        if since:
            since = datetime.fromtimestamp(int(since))
            tiles.filter('timestamp >=', since)
        out['tiles'] = []
        for tile in tiles:
            t = dict(cell='%s-%s' % (tile.col,tile.row),
                value=tile.value,player=tile.player.user_id(),
                playerposition=tile.position)
            out['tiles'].append(t)

        out['scores'] = []
        for player in game.playerlist:
            stars = Tile.all().filter('game =', game).filter('isStar =', True).filter('player =', game.getPlayerByEmail(player)).count()
            out['scores'].append(stars)
        return out

    def do_placetile(self, game):
        ''' obsolete way of placing a tile on the board '''
        out = dict()
        cell = cgi.escape(self.request.get('cell'))
        col,row = cell.split('-')
        value = cgi.escape(self.request.get('value'))
        game.currentHand().remove(value)
        position = game.myPosition()[:-1]-1
        tile = Tile(col=int(col),row=int(row),value=value,game=game,position=position)
        tile.save()
        out['cell'] = cell
        out['value'] = value
        return out

    def fail(self, reason):
        ''' helper to return failure messages '''
        out = dict()
        if reason:
            out['error'] = reason
        out['status'] = 'fail'
        return out

    def do_submittiles(self,game):
        ''' takes several tiles and commits them after doing several checks '''
        starttiles = [(6,17),(17,17),(17,6),(6,6)]
        start = False
        out = dict()
        word = []
        rows = []
        cols = []
        surrounding = []
        position = int(game.myPosition()[-1])

        if game.currentPlayer() != users.get_current_user():
            return self.fail('It is not your turn')

        for arg in self.request.arguments():
            cell = arg
            col,row = cell.split('-')
            if int(col) == starttiles[position-1][0] and int(row) == starttiles[position-1][1]:
                start = True
            rows.append(row)
            cols.append(col)
            surrounding.append((col,int(row)+1))
            surrounding.append((col,int(row)-1))
            surrounding.append((int(col)+1,row))
            surrounding.append((int(col)-1,row))
            value = cgi.escape(self.request.get(arg))

            # does the player have this tile?
            if not game.currentHand().count(value):
                return self.fail('You do not have the %s tile' % value)

            # is there already a tile on that spot?
            if Tile.all().filter('game =', game).filter('col =',int(col)).filter('row =',int(row)).count():
                return self.fail('You cannot place one tile on top of another')

            tile = Tile(col=int(col),row=int(row),value=value,game=game,position=position)
            word.append(tile)

        for tile in word:
            try:
                surrounding.remove((tile.col,tile.row))
            except:
                pass

        # are all tiles in the same row or column
        if len(set(rows)) != 1 and len(set(cols)) != 1:
            return self.fail('All tiles must be in the same row or column')

        # check validity of other tiles
        touching = False
        for tile in surrounding:
            othertile = Tile.all().filter('game =', game).filter('col =',int(tile[0])).filter('row =',int(tile[1])).get()
            # are no tiles touching a tile of someone elses
            if othertile:
                if othertile.player != users.get_current_user():
                    return self.fail("Your tiles cannot touch another player's tiles")
                else:
                    touching = True

        firstmove = False
        if Tile.all().filter('game =', game).filter('player =', users.get_current_user()).count() == 0:
            firstmove = True

        if firstmove and not start:
            return self.fail('Your first move must cover your start tile')

        # is at least one tile touching another tile of mine
        if not touching and not firstmove: 
            return self.fail('Your tiles must touch your other tiles')

        for tile in word:
            tile.save()
            game.currentHand().remove(tile.value)
        game.nextturn()
        game.save()
        out['status'] = 'success'
        out['hand'] = game.myHand()
        return out

class NewGameHandler(webapp.RequestHandler):
    ''' creates a new game '''
    def get(self,id=None):
        if not id:
            game = Game.create()
            game.save()
            return self.redirect("/game/%s/new" % game.key())
        game = Game.get(id)
        template_values = {
            'players': game.playerlist,
        }
        render_template(self.response,
            'templates/newgame.html', template_values)

    def post(self,id):
        game = Game.get(id)
        game.start()
        game.save()
        self.redirect("/game/%s/" % game.key())

# is this really necessary? can this be put elsewhere
class JoinHandler(webapp.RequestHandler):
    ''' joins a game '''
    def get(self,id):
        game = Game.get(id)
        game.join()
        game.save()
        self.redirect("/game/%s/" % game.key())

class GameHandler(webapp.RequestHandler):
    ''' the game '''
    def get(self,id):
        game = Game.get(id)
        if game.status == 'inprogress':
            template_values = {
                'playedtiles':Tile.all(),
                'tiles': game.myHand(),
                'player': game.myPosition(),
                'playercount': game.players,
                'position': game.myPosition()[-1],
                'players': game.playerlist,
                }
        elif game.status == 'waiting':
            template_values = {
                'players': game.playerlist,
            }
        else:
            return self.response.out.write('this game no longer exists')
        
        render_template(self.response,
            'templates/game_%s.html' % game.status, template_values)

# just for testing, remove eventually once old games delete themselves
class ResetHandler(webapp.RequestHandler):
    ''' deletes everything '''
    def get(self):
        db.delete(Game.all())
        db.delete(Tile.all())
        self.redirect("/")

def main():
    application = webapp.WSGIApplication([('/', MainHandler),
                                          ('/reset', ResetHandler),
                                          ('/game/(\w*)/', GameHandler),
                                          ('/game/([\w-]*)/join', JoinHandler),
                                          ('/game/([\w-]*)/new', NewGameHandler),
                                          ('/game/([\w-]*)/(\w*)', ApiHandler),
                                          ('/new', NewGameHandler)],
                                         debug=True)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
