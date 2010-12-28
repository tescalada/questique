from google.appengine.ext import db
from django.utils import simplejson

from google.appengine.api import users

from random import shuffle

import pickle
class GenericListProperty(db.Property):
  data_type = db.Blob

  def validate(self, value):
    if type(value) is not list:
      raise db.BadValueError('Property %s must be a list, not %s.' % (self.name, type(value)))
    return value

  def get_value_for_datastore(self, model_instance):
    return db.Blob(pickle.dumps(getattr(model_instance,self.name)))

  def make_value_from_datastore(self, value):
    return pickle.loads(value)





class Game(db.Model):
    tiles = db.StringListProperty()
    turns = db.IntegerProperty()
    players = db.IntegerProperty()
    status = db.StringProperty()
    playerlist = db.StringListProperty()
    playerhands = GenericListProperty()

    #player1 = db.UserProperty()
    #player1hand = db.StringListProperty()
    #player2 = db.UserProperty()
    #player2hand = db.StringListProperty()
    #player3 = db.UserProperty()
    #player3hand = db.StringListProperty()
    #player4 = db.UserProperty()
    #player4hand = db.StringListProperty()
    
    def getPlayerByEmail(self,email):
        if email in self.playerlist:
            return users.User(email)
 
    def getPlayerByPosition(self,position):
        if position >= 1 and position <= len(self.playerlist):
            return users.User(self.playerlist[position-1])


    def currentPlayer(self):
        #players=[self.player1,self.player2,self.player3,self.player4]
        currentplayer = (self.turns % self.players) + 1
        return self.getPlayerByPosition(currentplayer)
        #return players[currentplayer]

    def currentHand(self):
        #hands=[self.player1hand,self.player2hand,self.player3hand,self.player4hand]

        currentplayer = (self.turns % self.players)
        return self.playerhands[currentplayer]

    def myHand(self):
        #players=[self.player1,self.player2,self.player3,self.player4]
        #hands=[self.player1hand,self.player2hand,self.player3hand,self.player4hand]
        for player in enumerate(self.playerlist):
            if player[1] == users.get_current_user().email():
                return self.playerhands[player[0]]

    def myPosition(self):
        #players=[self.player1,self.player2,self.player3,self.player4]
        for player in self.playerlist:
            if player == users.get_current_user().email():
                return 'player%s' % (self.playerlist.index(player) + 1)



    @classmethod
    def create(cls):
        tilecounts = dict(A=15,B=4,C=3,D=6,E=20,F=3,G=5,H=3,I=14,J=1,K=1,L=6,M=5,N=9,O=11,P=4,Q=1,R=9,S=7,T=9,U=5,V=1,W=2,X=1,Y=1,Z=1,blank=3)
        tiles = []
        for key in tilecounts.keys():
            for t in range(tilecounts[key]):
                tiles.append(key)
        shuffle(tiles)
        #return cls(tiles=tiles, player1=users.get_current_user(), playerlist=[users.get_current_user().email()], status='waiting')
        return cls(tiles=tiles, playerlist=[users.get_current_user().email()], playerhands=[], status='waiting')

    def start(self):
        self.turns = 0
        self.players = len(self.playerlist)
        self.status = 'inprogress'
        shuffle(self.playerlist)
        for player in enumerate(self.playerlist):
            self.playerhands.append([])
            for t in range(7): 
                self.playerhands[player[0]].append(self.tiles.pop())

    def join(self):
        if self.status == 'waiting':
            user = users.get_current_user()
            if len(self.playerlist) < 4:
                self.playerlist.append(user.email())
            #if not self.player2:
            #    self.player2 = user
            #elif not self.player3:
            #    self.player3 = user
            #elif not self.player4:
            #    self.player4 = user

    def nextturn(self):
        currenthand = self.currentHand()
        for x in range(7-len(currenthand)):
            currenthand.append(self.tiles.pop())
        self.turns += 1

class Tile(db.Model):
    value = db.StringProperty()
    row = db.IntegerProperty()
    col = db.IntegerProperty()
    isStar = db.BooleanProperty()
    status = db.StringProperty()
    player = db.UserProperty()
    game = db.ReferenceProperty(Game)
    timestamp = db.DateTimeProperty(auto_now=True)
    position = db.IntegerProperty()

    def save(self):
        stars = [2,10,13,21]
        if self.row in stars and self.col in stars:
            self.isStar = True
        else:
            self.isStar = False
        self.player = users.get_current_user()
        db.Model.save(self)


