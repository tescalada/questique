currenthand = new Object();
currenthandobjects = new Object();

$(document).ready(function() {
    $("#board").html(buildBoard(player));
    updateTiles();
    setInterval ( "updateTiles()", 5000 );
    $( ".hand_tile" ).draggable({ revert: "invalid"});
    makeDroppable();
    //$( "#hand" ).sortable({
    //    revert: false,
    //    axis: 'x'
    //});
    $(".board_tile").disableSelection();
});


function makeDroppable(){
    $( "td.droppable" ).droppable({
        activeClass: "ui-state-hover",
        hoverClass: "ui-state-active",
        drop: function( event, ui ) {
            $(this).droppable('disable');
           // $(ui.draggable).draggable('disable');
            var tile = ui.draggable;
            tile.detach();
            $(this).append(tile);
<<<<<<< HEAD
            tile.css('top',0);
            tile.css('left',0);
            var value = tile.html();
            // blank tile hack
            if (value == '&nbsp;'){ value = 'blank'; }
            alert(value);
=======
            tile.css('top','');
            tile.css('left','');
            var value = tile.text();
>>>>>>> f8a209afe2c9c3827d012b8c6d149f1e68a2443e
            var idx = $(this).attr('id');
            currenthand[idx]=value;
            currenthandobjects[$(this).attr('id')]=tile;
        }
    });
    $( "td.droppable" ).droppable('enable');
    $( "td.droppable .board_tile" ).parent('td').droppable('disable');
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
    var td = $('<td><span class="container"></span></td>');
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
        makeDroppable();

        if (data.myturn == '1'){
            $('#actions').show();
        } else {
            $('#actions').hide();
        }
        if (posarray == ''){
            posarray = [1,2,3,4];
            posarray = posarray.splice(5 - position).concat(posarray);
        }

        for (tile in data.tiles){
            tile = data.tiles[tile];
            pos = posarray[tile.playerposition - 1];
            var positionClass = '';
            if (pos == 2) {
                positionClass = "tile_position_br";
            } else if (pos == 3) {
                positionClass = "tile_position_ur";
            } else if (pos == 4) {
                positionClass = "tile_position_ul";
            }

            // blank tile hack
            if (tile.value == 'blank'){ tile.value = '&nbsp;'; }

            $('#'+tile.cell).html('<div class="board_tile '+positionClass+'">'+tile.value+'</div>').addClass('p'+tile.player);
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
            mytiles = data.hand;
            for (tile in data.hand){
                $('#hand').append('<div class="hand_tile">'+data.hand[tile]+'</div>');
            }
            $( ".hand_tile" ).draggable({ revert: "invalid"});
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
    //$("img.tile").css('left','0px');
    //$("img.tile").css('top','0px');
    $(".hand_tile").draggable('enable');
    $(".hand_tile").each(function(idx,tile) {
        $(tile).detach();
        $("#hand").append(tile);
    });
    makeDroppable();
    //$(".tile").draggable('destroy');
    //$( "#hand" ).sortable({
    //    revert: false,
    //    axis: 'x'
    //});
    $(".board_tile").disableSelection();

}
