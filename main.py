#!/usr/bin/env python
from google.appengine.ext import webapp, db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app

from google.appengine.api import users, channel
import cgi
from models import Game, Tile, Player
import random
import string
import os
from django.utils import simplejson
from time import time
from datetime import datetime
import urllib, hashlib

def player_required(handler_method):
    """A decorator to require that a user be logged in and have a player profile to access a handler.

    To use it, decorate your get() method like this:

        @player_required
        def get(self):
            player = Player.get_current_player(self)
            self.response.out.write('Hello, ' + player.user.nickname())

    We will redirect to a login page if the user is not logged in. We always
    redirect to the request URI, and Google Accounts only redirects back as a GET
    request, so this should not be used for POSTs.
    Will also create a profile if the currently logged in user does not have one.
    """
    def check_login(self, *args):
        if self.request.method != 'GET':
            raise webapp.Error('The player_required decorator can only be used for GET requests')
        user = users.get_current_user()
        if not user:
            return self.redirect(users.create_login_url(self.request.uri))
        player = Player.all().filter('user =', user).get()
        if not player:

            default = "http://www.example.com/default.jpg"
            size = 100
            gravatar = "http://www.gravatar.com/avatar/%s?%s" % (hashlib.md5(user.email().lower()).hexdigest(),urllib.urlencode({'d':default,'s':str(size)}))
            player = Player(user=user, gravatar=gravatar, games=0, wins=0, losses=0, bestsoloscore=0, name=str(user.nickname()).split('@')[0])
            player.save()
        return handler_method(self, *args)
    return check_login


def render_template(response, templateName, values):
    path = os.path.join(os.path.dirname(__file__), templateName)
    return response.out.write(template.render(path, values))

def sendMessage(game,message):
    jsonmessage = simplejson.dumps(message)
    for player in game.playerlist:
        channel.send_message(player + str(game.key()), jsonmessage)

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
    @player_required
    def get(self,id,action):
        self.response.headers['Content-Type'] = 'application/json'
        gameid = cgi.escape(self.request.get('game'))
        game = Game.get(id)
        out = dict()
        actions = ['placetile','submittiles','tiles','dumptiles','chat','start','join']
        if action in actions:
            f = getattr(self, 'do_' + action)
            out = f(game)
        else:
            out = self.fail('invalid action')
        game.save()
        if action in ['submittiles','dumptiles']:
            sendMessage(game, dict(updatetiles=1))
        self.response.out.write(simplejson.dumps(out))

    def do_chat(self, game):
        '''testing chat'''
        name = Player.get_current_player().name

        message = cgi.escape(self.request.get('message'))
        chat = '%s: %s' % (name, message)
        game.chat += '\n' + chat
        game.save()
        sendMessage(game, dict(chat=chat))

    def do_tiles(self, game):
        '''gets the list of tiles played and player scores '''
        out = dict()
        out['timestamp'] = int(time())
        currentplayer = game.currentPlayer()
        #playerhash = 'p%s' % hash(currentplayer.email())
        playerhash = str(currentplayer.key())
        out['currentplayer'] = playerhash
        if currentplayer.key() == Player.get_current_player().key():
            out['myturn'] = 1
        tiles = game.gametiles
        since = cgi.escape(self.request.get('since'))
        if since:
            since = datetime.fromtimestamp(int(since))
            tiles.filter('timestamp >=', since)
        out['tiles'] = []
        for tile in tiles:
            t = dict(cell='%s-%s' % (tile.col,tile.row),
                value=tile.value,player=str(tile.player.key()),
                playerposition=tile.position)
            out['tiles'].append(t)

        scores = dict()
        for player in game.playerlist:
            player = game.getPlayerByEmail(player)
            score = game.gametiles.filter('player =',player).filter('isStar =', True).count()
            scores[str(player.key())] = score
            if (len(game.playerlist) > 1 and score >= 4) or score == 16:
                    out['gameover'] = 1
                    out['winner'] = player.name
                    if player.key() == Player.get_current_player().key():
                        out['youwin'] = 1

        out['scores'] = scores

        out['challengable'] = []
        for id in game.lastword:
            tile = Tile.get(id)
            out['challengable'].append('%s-%s' % (tile.col, tile.row))

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
        currentplayer = Player.get_current_player(); 

        if game.currentPlayer().key() != currentplayer.key():
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
            if game.gametiles.filter('col =',int(col)).filter('row =',int(row)).count():
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
            othertile = game.gametiles.filter('col =',int(tile[0])).filter('row =',int(tile[1])).get()
            # are no tiles touching a tile of someone elses
            if othertile:
                if othertile.player.key() != currentplayer.key():
                    return self.fail("Your tiles cannot touch another player's tiles")
                else:
                    touching = True

        firstmove = False
        if game.gametiles.filter('player =',currentplayer).count() == 0:
            firstmove = True

        if firstmove and not start:
            return self.fail('Your first move must cover your start tile')

        # is at least one tile touching another tile of mine
        if not touching and not firstmove: 
            return self.fail('Your tiles must touch your other tiles')

        game.lastword = []

        for tile in word:
            tile.save()
            game.lastword.append(tile.key())
            game.currentHand().remove(tile.value)
        game.nextturn()
        game.save()
        out['status'] = 'success'
        out['hand'] = game.myHand()
        return out

    def do_start(self,game):
        ''' starts the game '''
        out = dict()
        if users.get_current_user().email() != game.playerlist[0]:
            return self.fail('Only the creator may start the game')
        game.start()
        game.save()
        out['status'] = 'success'
        return out

    def do_join(self,game):
        ''' starts the game '''
        out = dict()
        if users.get_current_user().email() in game.playerlist:
            return self.fail('You are already in this game')
        game.join()
        game.save()
        out['status'] = 'success'
        return out

    def do_dumptiles(self,game):
        ''' swaps your hand for a new one '''
        out = dict()
        if game.currentPlayer().key() != Player.get_current_player().key():
            return self.fail('It is not your turn')
        game.dumpMyHand()
        game.nextturn()
        game.save()
        out['status'] = 'success'
        out['hand'] = game.myHand()
        return out

class NewGameHandler(webapp.RequestHandler):
    ''' creates a new game '''
    @player_required
    def get(self):
        game = Game.create()
        game.save()
        return self.redirect("/game/%s/" % game.key())

class GameHandler(webapp.RequestHandler):
    ''' the game '''
    @player_required
    def get(self,id):
        game = Game.get(id)

        #default = "http://www.example.com/default.jpg"
        #size = 100
        profiles = []
        SIMPLE_TYPES = (int, long, float, bool, dict, basestring, list)

        if game.status == 'inprogress':
            for email in game.playerlist:
                profile = Player.get_by_email(email).to_dict()
                #profile['gravatar'] = "http://www.gravatar.com/avatar/%s?%s" % (hashlib.md5(player.lower()).hexdigest(),urllib.urlencode({'d':default,'s':str(size)})) 
                #profile['name'] = game.getPlayerByEmail(player).nickname().split('@')[0]
                #profile['hash'] = 'p%s' % hash(player)
                profiles.append(profile)

            cut = int(game.myPosition()[-1]) - 1
            profiles = profiles[cut:] + profiles[:cut]

            jsonprofiles = simplejson.dumps(profiles)


            template_values = {
                'tiles': game.myHand(),
                'player': game.myPosition(),
                'playercount': game.players,
                'position': game.myPosition()[-1],
                'players': game.playerlist,
                'profiles': jsonprofiles,
                'chat': game.chat,
                'logout' : users.create_logout_url("/"),
                'token': channel.create_channel(users.get_current_user().email() + str(game.key())),
                }
        elif game.status == 'waiting':
            template_values = {
                'players': [Player.get_by_email(email).name for email in game.playerlist],
            }

            if users.get_current_user().email() not in game.playerlist:
                template_values['joinlink'] = 1

            if users.get_current_user().email() == game.playerlist[0]:
                template_values['startlink'] = 1

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
        db.delete(Player.all())
        self.redirect("/")

class LogoutHandler(webapp.RequestHandler):
    ''' redirects to logout url '''
    def get(self):
        self.redirect(users.create_logout_url("/"))

def main():
    application = webapp.WSGIApplication([('/', MainHandler),
                                          ('/reset', ResetHandler),
                                          ('/logout', LogoutHandler),
                                          ('/game/(\w*)/', GameHandler),
                                          ('/game/([\w-]*)/(\w*)', ApiHandler),
                                          ('/new', NewGameHandler)],
                                         debug=True)
    run_wsgi_app(application)

if __name__ == '__main__':
    main()
