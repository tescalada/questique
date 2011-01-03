
function joinGame(){
    $.getJSON('join', function(data) {
        if (data.status == 'success'){
            location.reload();
        } else {
            alert(data.error);
        }
    });
}

function startGame(){
    observer = $('#observer option:selected').val();
    $.getJSON('start', {'observer': observer } ,function(data) {
        if (data.status == 'success'){
            location.reload();
        } else {
            alert(data.error);
        }
    });
}

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
            say(data.chat); 
        } else if (data.playerlist) {
            playerlist = $('#playerlist');
            playerlist.html('')
            for (player in data.playerlist){
                playerlist.append('<li>'+data.playerlist[player]+'</li>'); 
            }
        } else {
            updateTiles(); 
        } 
    };
    socket.onerror = function(){ location.reload(); };
    socket.onclose = function(){ location.reload(); };
}

function pause(seconds) {
    var date = new Date();
    var curDate = null;
    var millis = seconds * 1000;
    do { curDate = new Date(); } 
    while(curDate-date < millis);
} 

function say(chat){
    $('#chatwindow').append('\n' + chat); 
    $('#chatwindow').attr('scrollTop',$('#chatwindow').attr('scrollHeight') );
}

function tutorial(){
    say('Hello, and welcome to the questique tutorial');
    pause(5);
    say('Hello, and welcome to the questique tutorial');
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
    var table = $('#board');
    // player0 is an observer
    if (player == "player1" || player == "player0"){
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

gamestatus = 'inprogress'

timesinceupdate = 0;
function updateTiles(){
    if (gamestatus != 'inprogress'){
        return ;
    }
    $.getJSON('tiles', {since:timesinceupdate}, function(data) {
        timesinceupdate = data.timestamp;

        $('.playerprofile').css('background-color','lightblue');
        $('.' + data.currentplayer).css('background-color','red');

        maxstars = 4;
        if (playercount == 1){
            maxstars = 16;
        }
        for (playerkey in data.scores){
            $('.' + playerkey).find('div.stars span.yellowstars').html(Array(data.scores[playerkey]+1).join("*"));
            $('.' + playerkey).find('div.stars span.graystars').html(Array(maxstars - data.scores[playerkey]+1).join("*"));
        }
        makeDroppable();

        if (data.gameover == '1'){
            if (data.youwin == '1'){
                alert('You win!');
            } else {
                if (data.outoftiles == '1'){
                    alert('You lose! Ran out of tiles');
                } else {
                    alert('You lose! ' + data.winner + ' won!');
                }
            }
            gamestatus = 'over';
        }

        pottile = "<div style='width:3px;height:3px;margin:1px;background-color:green;display:inline;'><span class='container'></span></div>";
        $('#tilesleft').html(Array(data.tilesleft).join(pottile));

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
