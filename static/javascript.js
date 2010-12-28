

currenthand = new Object();
currenthandobjects = new Object();

$(document).ready(function() {

    $("#board").html(buildBoard(player));
    updateTiles();
    setInterval ( "updateTiles()", 5000 );
    $( "img.tile" ).draggable({ revert: "invalid", snap: "td.droppable", snapMode: "inner" });
    makeDroppable();
    //$( "#hand" ).sortable({
    //    revert: false,
    //    axis: 'x'
    //});
    $("img").disableSelection();


});


function makeDroppable(){
    $( "td.droppable" ).droppable({
        activeClass: "ui-state-hover",
        hoverClass: "ui-state-active",
        drop: function( event, ui ) {
            $(this).droppable('disable');
            $(ui.draggable).draggable('disable');
            currenthand[$(this).attr('id')]=$(ui.draggable).attr('alt');
            currenthandobjects[$(this).attr('id')]=$(ui.draggable);
        }
    });
    $( "td.droppable" ).droppable('enable');
    $( "td.droppable img" ).parent('td').droppable('disable');
}


function buildBoard(player){
    var table = $('<table></table>');

    if (player == "player1"){
        for (var r = 1; r <= 22; r++) {
            var tr = $('<tr></tr>');
            for (var c = 1; c <= 22; c++) {
                tr.append(makeCell(c,r));
            }
            table.append(tr);
        }
    } else if (player == "player3"){
        for (var r = 22; r >= 1; r--) {
            var tr = $('<tr></tr>');
            for (var c = 22; c >= 1; c--) {
                tr.append(makeCell(c,r));
            }
            table.append(tr);
        }
    } else if (player == "player2"){
        for (var r = 1; r <= 22; r++) {
            var tr = $('<tr></tr>');
            for (var c = 22; c >= 1; c--) {
                tr.append(makeCell(r,c));
            }
            table.append(tr);
        }
    } else if (player == "player4"){
        for (var r = 22; r >= 1; r--) {
            var tr = $('<tr></tr>');
            for (var c = 1; c <= 22; c++) {
                tr.append(makeCell(r,c));
            }
            table.append(tr);
        }
    } 






    return table;
}


function makeCell(c,r){
    var stars = {2:'',10:'',13:'',21:''}
    var starts = {6:'',17:''}
    var td = $('<td>&nbsp;</td>');
    td.attr('id', c+'-'+r);
    td.addClass('droppable');
    if (r in stars){
        if (c in stars){
            td.addClass('star');
        }
    }
    if (r in starts){
        if (c in starts){
            td.addClass('start');
        }
    }

    return td
}

//tmp function?
function setTile(col,row,val){
    $('#'+col+'-'+row).html(val);
}

posarray = '';

timesinceupdate = 0;
function updateTiles(){
    $.getJSON('tiles', {since:timesinceupdate}, function(data) {
        timesinceupdate = data.timestamp;

        $('#currentplayername').html(data.currentplayer);
        count = 1;
        for (score in data.scores){
            $('#player'+count+'score').html(data.scores[score]);
            count += 1;
        }
        
        if (data.myturn == '1'){
            $('#actions').show();
            makeDroppable();
        } else {
            $('#actions').hide();
            $( "td.droppable" ).droppable('disable');
        }

        if (posarray == ''){
            posarray = new Array();
            for (var x = 1; x <= 4 ; x++){
                posarray.push(x);
            }
            posarray = posarray.splice(5 - position).concat(posarray);
        }

        for (tile in data.tiles){
            tile = data.tiles[tile];
            pos = posarray[tile.playerposition - 1];
            $('#'+tile.cell).html('<img src="/static/images/'+tile.value+''+pos+'.gif" title="'+tile.value+'" alt="'+tile.value+'"/>').addClass('p' + tile.player);
        }
    });
}


var resp = 0;

mytiles = 0;

function submitTiles(){
    $.getJSON('submittiles', currenthand, function(data) {
        if (data.status == 'success'){
            updateTiles();
            currenthand = new Object();
            for (obj in currenthandobjects){
                currenthandobjects[obj].remove();
            }
            currenthandobjects = new Object();
            $('#hand').html('');
            mytiles = data.hand
            for (tile in data.hand){
                //$('#hand').append('<div class="tile">'+data.hand[tile]+'</div>')
                tile = data.hand[tile];
                $('#hand').append('<img class="tile" src="/static/images/'+tile+'1.gif" title="'+tile+'"alt="'+tile+'"/>');
            }
            $( "img.tile" ).draggable({ revert: "invalid", snap: "td.droppable", snapMode: "inner" });
            $('#actions').hide();
        } else {
            alert(data.error);

            resetTiles();
        }
    });
}

function resetTiles(){
    
    currenthand = new Object();
    currenthandobjects = new Object();
    $("img.tile").css('left','0px');
    $("img.tile").css('top','0px');
    $("img.tile").draggable('enable');
    makeDroppable();
    //$(".tile").draggable('destroy');
    //$( "#hand" ).sortable({
    //    revert: false,
    //    axis: 'x'
    //});
    $("img").disableSelection();

}


