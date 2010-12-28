#!/usr/bin/python

from threading import Thread, enumerate
from random import randint as rint
import Image,ImageDraw,ImageFont
import sys
import os
import uuid

PATH = os.path.dirname(__file__)
sys.path.append(PATH)


def makeTile(height,width,letter,color):
        colors=['#CC9966','#FFFF80','#00FFFF','#08B853']
        ifo=ImageFont.load("fonts/helvR18.pil")
        img = Image.new("RGB", (height, width), colors[color])
        draw = ImageDraw.Draw(img)
        draw.rectangle([0,0,height-1,width-1], outline="black" ) # draw outer frame
        if letter != 'blank':
            draw.text((6,1),letter,"#000000",font=ifo)
        img.rotate(color * 90).save(os.path.join(PATH, 'static/images',
        '%s%s.gif' % (letter,color+1)), "GIF")

letters = 'POIUYTREWQLKJHGFDSAMNBVCXZ'

for letter in letters:
    for color in range(4):
        tile = makeTile(30,30,letter,color)

for color in range(4):
    tile = makeTile(30,30,'blank',color)




