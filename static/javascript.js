$(document).ready(function() {
    $("#board").html(buildBoard(player));
    updateTiles();
    setInterval ( "updateTiles()", 60000 );
    $( ".hand_tile" ).draggable({ revert: "invalid"});
    makeDroppable();
    //$( "#hand" ).sortable({
    //    revert: false,
    //    axis: 'x'
    //});
    $(".board_tile").disableSelection();

    var count = 1;
    for (var profile in profiles){
        profile = profiles[profile];
        console.log(profile);
        $('div#player'+count+'profile').addClass(profile.key);
        $('div#player'+count+'profile').append("<img src='"+profile.gravatar+"' style='float:left;'/>");
        $('div#player'+count+'profile').append("<div class='info'><div>"+profile.name+"</div><div class='stars'></div></div>");
        count += 1;
    }

    $('#chatwindow').attr('scrollTop',$('#chatwindow').attr('scrollHeight') );
});

function chat(){
    $.get("chat", { message: $('#chattext').val() } );
    $('#chattext').val('');
    return false;
}

function openChannel(token){
    channel = new goog.appengine.Channel(token);
    socket = channel.open();
    socket.onopen = function(){  };
    socket.onmessage = function(message){ 
    var data = JSON.parse(message.data);
        if (data.chat){
            $('#chatwindow').append('\n' + data.chat); 
            $('#chatwindow').attr('scrollTop',$('#chatwindow').attr('scrollHeight') );
        } else {
            updateTiles(); 
        } 
    };
    socket.onerror = function(){ location.reload(); };
    socket.onclose = function(){ location.reload(); };
}


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
            //tile.css('top',0);
            //tile.css('left',0);
            var value = tile.html();
            tile.css('top','');
            tile.css('left','');
            //var idx = $(this).attr('id');
        }
    });
    $( "#hand" ).droppable({
        activeClass: "ui-state-hover",
        hoverClass: "ui-state-active",
        drop: function( event, ui ) {
            var tile = ui.draggable;
            tile.detach();
            $(this).append(tile);
            tile.css('top','');
            tile.css('left','');
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

        $('.playerprofile').css('background-color','lightblue');
        $('.' + data.currentplayer).css('background-color','red');

        for (playerkey in data.scores){
            $('.' + playerkey).find('div.stars').html(Array(data.scores[playerkey]+1).join("*"));
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

            $('#'+tile.cell).html('<div class="board_tile '+positionClass+'">'+tile.value+'</div>').addClass('p'+tile.player);
        }

        $('div.board_tile').removeClass('challengable');
        for (tile in data.challengable){
            tile = data.challengable[tile];
            $('#' + tile + ' div.board_tile').addClass('challengable');
        }
    });
}


function submitTiles(){
    placedtiles = new Object();
    $('td div.hand_tile').each(function(){ 
        if ($(this).parent('td').attr('id')){
            placedtiles[$(this).parent('td').attr('id')] = $(this).html(); 
        }
    });

    $.getJSON('submittiles', placedtiles, function(data) {
        if (data.status == 'success'){
            updateTiles();
            $('#hand').html('');
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


function dumpTiles(){
    if (confirm('Are you sure you want to dump your hand and draw a new hand?')){
        $.getJSON('dumptiles', function(data) {
            if (data.status == 'success'){
                updateTiles();
                $('#hand').html('');
                $(".hand_tile").each(function(idx,tile) {
                    $(tile).remove();
                });

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
}


function challengeTiles(){
    if (confirm('Are you sure you want to challenge the yellow tiles?')){
        alert("too bad you can't do that yet");
    }
}




function resetTiles(){
    
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
