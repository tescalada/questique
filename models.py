from google.appengine.ext import db
from django.utils import simplejson
from google.appengine.api import users
from random import shuffle
import pickle # is simplejson faster?

class GenericListProperty(db.Property):
    ''' Property to hold a list of lists '''
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
    ''' game model '''
    tiles = db.StringListProperty()
    turns = db.IntegerProperty()
    players = db.IntegerProperty()
    status = db.StringProperty()
    playerlist = db.StringListProperty()
    playerhands = GenericListProperty()

    def getPlayerByEmail(self,email):
        ''' turns an email into a user object '''
        if email in self.playerlist:
            return users.User(email)

    def getPlayerByPosition(self,position):
        ''' turns a position 1-4 into a user object '''
        if position >= 1 and position <= len(self.playerlist):
            return users.User(self.playerlist[position-1])

    def currentPlayer(self):
        ''' get the player whos turn it is to play '''
        currentplayer = (self.turns % self.players) + 1
        return self.getPlayerByPosition(currentplayer)

    def currentHand(self):
        ''' get the hand of the current player '''
        currentplayer = (self.turns % self.players)
        return self.playerhands[currentplayer]

    def myHand(self):
        ''' tiles in the hand of the requesting user '''
        for player in enumerate(self.playerlist):
            if player[1] == users.get_current_user().email():
                return self.playerhands[player[0]]

    def myPosition(self):
        ''' board position of the requesting user, 1-4 '''
        for player in self.playerlist:
            if player == users.get_current_user().email():
                return 'player%s' % (self.playerlist.index(player) + 1)

    @classmethod
    def create(cls):
        ''' class method to create a new game '''
        tilecounts = dict(A=15,B=4,C=3,D=6,E=20,F=3,G=5,H=3,I=14,J=1,K=1,L=6,M=5,N=9,O=11,P=4,Q=1,R=9,S=7,T=9,U=5,V=1,W=2,X=1,Y=1,Z=1,blank=3)
        tiles = []
        for key in tilecounts.keys():
            for t in range(tilecounts[key]):
                tiles.append(key)
        shuffle(tiles)
        return cls(tiles=tiles, playerlist=[users.get_current_user().email()], playerhands=[], status='waiting')

    def start(self):
        ''' starts the game, goes from waiting to inprogress '''
        self.turns = 0
        self.players = len(self.playerlist)
        self.status = 'inprogress'
        shuffle(self.playerlist)
        for player in enumerate(self.playerlist):
            self.playerhands.append([])
            for t in range(7): 
                self.playerhands[player[0]].append(self.tiles.pop())

    def join(self):
        ''' add the requesting user to the game '''
        if self.status == 'waiting':
            user = users.get_current_user()
            if len(self.playerlist) < 4 and user.email() not in self.playerlist:
                self.playerlist.append(user.email())

    def nextturn(self):
        ''' continue play to the next player '''
        currenthand = self.currentHand()
        for x in range(7-len(currenthand)):
            currenthand.append(self.tiles.pop())
        self.turns += 1

class Tile(db.Model):
    ''' tile model '''
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
        ''' extending the save function to also keep track of stared tiles '''
        stars = [2,10,13,21]
        if self.row in stars and self.col in stars:
            self.isStar = True
        else:
            self.isStar = False
        self.player = users.get_current_user()
        db.Model.save(self)


