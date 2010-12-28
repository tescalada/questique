# started on the commandline, moved to the web

rules = ''' 
rules:
board 22 x 22
4 players
stars at positions 2x2 10x10 and all other variations
player starts on diamonds at 7x7 3 wide facing player
diagonal touching is ok, direct side to side is not
'''

class Board:
    rows = 22
    cols = 22
    board = [[("",None) for i in range(cols)] for j in range(rows)]
    stars = [1,9,12,20]
    for x in stars:
        for y in stars:
            board[x][y] = ("",'star')

    starts = [5,16]
    for x in starts:
        for y in starts:
            board[x][y] = ("",'start')

    def __str__(self):
        out = "     "
        out += "  ".join([chr(int(x)+65) for x in range(len(self.board[0]))])
        out += "\n"
        r = 0
        for row in self.board:
            r +=1
            out += str(r).rjust(2) + ": "
            out+= " ".join(x.rjust(2) for x in row)
            out += "\n"
        return out

    def table(self):
        out = "<table border='1'>"
        out += "<tr>"
        out += "<td></td>"
        for value in range(len(self.board[0])):
            out += "<td>%s</td>" % chr(int(value)+65)
        out += "</tr>"
        r = 0
        for row in self.board:
            r += 1
            out += "<tr>"
            out += "<td>%s</td>" % str(r)
            col = 65
            for value,style in row:
                id = chr(col) + str(r)
                out += "<td id='%s' class='%s'>%s</td>" % (id, style,value)
                col += 1
            out += "</tr>"
        out += "</table>"
        return out


    def tile(self, col, row, value=None):
        col = ord(col) - 65
        row -= 1
        if value:
            self.board[row][col] = value.rjust(2)
        return self.board[row][col]



if __name__ == "__main__":

    board = Board()
    #print board.tile('B',6, "h")
    print board

    while 1:
        start = raw_input("Enter a start ('A5'):")
        direction = raw_input("Enter a direction ('H/[V]'):")
        if not direction:
            direction = "V"
        word = raw_input("Enter a word:")
        x = start[0]
        y = int(start[1:])
        for c in range(len(word)):
            board.tile(x,y,word[c])
            if direction == 'V':
                x = chr(ord(x) + 1)
            else:
                y += 1
        print board

#while 1:
#    inp = raw_input("Enter a move ('A5=G'):").split("=")
#    val = inp[1]
#    board.tile(inp[0][0],int(inp[0][1:]),val)
#    print board
