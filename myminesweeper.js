/*global alert: false, console: false, jQuery: false */
/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global $ */

//gameInfo object used to keep track of all major properties of the game
var gameInfo = {
    gameOver : false,
    rows : 8,
    cols : 8,
    smiley : "<img src='https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSCZGTB3coUpMOirRyQS-vhmQrhQ_JRC9GdipcMKMsjK1c4Yrtn4hIhWGY'/>",
    frowny : "<img src='http://static.fjcdn.com/comments/4846466+_63420ea4ab1af11dcf29ec1e704e0175.png'/>",
    bombPic : "<img src='http://dougx.net/sweeper/mine.png'/>",
    flagPic : "<img src='http://www.nyx.net/~ljacobso/java/MS-0.8/flag.gif'/>",
    mineProb : .15625,
    gameLevel : "Easy",
    numLeftToFlag : 0,
    actualMines: 0,
    numOpened: 0,
    sqArray : [],
    queue : [],
    sqQueue : [],
    updateScore : function() {
        document.getElementById("scoreboard").innerHTML=gameInfo.numLeftToFlag;
    },
    checkWin : function() {
        var numCells = this.rows*this.cols;
        var notMines = numCells - this.actualMines;
        if (notMines == this.numOpened){
            alert("YOU WIN!!!! PLAY AGAIN?!");
        }
    }
};//end of gameInfo object



//findSize function that determines the size of the board and the mine probability based on the selected game level
var findSize = function () { 
    "use strict";
    switch (gameInfo.gameLevel) {
    case "Easy":
        gameInfo.rows = 8;
        gameInfo.cols = 8;
        gameInfo.mineProb = .15625;
        break;
    case "Medium":
        gameInfo.rows = 10;
        gameInfo.cols = 10;
        gameInfo.mineProb = .15625;
        break;
    case "Hard":
        gameInfo.rows = 16;
        gameInfo.cols = 30;
        gameInfo.mineProb = .20625;
        break;
    default:
        gameInfo.rows = 8;
        gameInfo.cols = 8;
        gameInfo.mineProb = .15625;
    }
};//end of findSize function



//GridSquare object constructor
function GridSquare(r,c) {
    "use strict";
    this.row = r;
    this.col = c;
    this.booleanMine = false;
	this.checked = false;
	this.flag = false;
    this.uncovered = false;
    this.mineCount = 0;
    this.neighborArray = [];
    this.cellNeighborArray = [];
    this.addMine = function () {
        if (Math.random() < gameInfo.mineProb) {
            gameInfo.numLeftToFlag++;
            gameInfo.actualMines++;
            this.booleanMine = true;
        }
    };
    this.addNeighbors = function (x, y) {
        //using startX,startY,stopX,and stopY so that we take care of the edge cases within this loop,
        //rather than needing a separate loop for the border squares
        var i, j, startX = -1, startY = -1, stopX = 1, stopY = 1,neighCell;
        if (x == 0) {startX ++; }
        if (x == gameInfo.rows - 1) {stopX --; }
        if (y == 0) {startY ++; }
        if (y == gameInfo.cols - 1) {stopY --; }
        for (i = startX; i <= stopX; i++) {
	        for (j = startY; j <= stopY; j++) {
		        if (!(i == 0 && j == 0)) {
                    this.mineCount += gameInfo.sqArray[x + i][y + j].booleanMine;
                    this.neighborArray.push(gameInfo.sqArray[x + i][y + j]);
                    this.cellNeighborArray.push(document.getElementById("boardbody").rows[x+i].cells[y+j]);
                }
            }
        }
    };
}; //end of gridSquare object constructor



//createBoard function that is called when the start button is clicked
var createBoard = function () {
    var i, j, k, l;
    var theBoard = document.getElementById("boardbody");
    document.getElementById("header").colSpan= gameInfo.cols;
	for(i = 0; i < gameInfo.rows; i++) {
		gameInfo.sqArray[i] = [];
        var tableRow = document.createElement("tr");
        theBoard.appendChild(tableRow);
		for(j = 0; j < gameInfo.cols; j++) {
			var square = new GridSquare(i,j);
            square.addMine();
            gameInfo.sqArray[i][j] = square;
            var tableDat = document.createElement("td");
            tableRow.appendChild(tableDat);
            if (square.booleanMine){
                tableDat.className = "bomb";
            }
		}
	}
    //need to loop through the sqArray again (rather than adding neighbors in the above loop) because each of a square's neighbors must exist in the sqArray before we attempt to add these neighbors to the square's neighborArray
    for (k = 0; k < gameInfo.rows; k++) {
        for (l = 0; l < gameInfo.cols; l++) {
            gameInfo.sqArray[k][l].addNeighbors(k, l);
        }
    }
    $("#start").html(gameInfo.smiley);
}; //end of createBoard function




//jQuery
$(document).ready(function () {
    createBoard();
    //code that is executed once the smiley face start button is pressed
    $(document).on('click', '#start', function () {
        gameInfo.actualMines = 0;
        gameInfo.numLeftToFlag = 0;
        gameInfo.numOpened = 0;
        gameInfo.gameOver = false;
        var gameLevel =  $('input[name=level]:checked', '#difficulty').val();
        gameInfo.gameLevel = gameLevel; 
        $("#boardbody").empty();
        findSize();
        createBoard();
        gameInfo.updateScore();
        
        //bfs function that recursively reveals all neighbors of a 0
        $.fn.bfs = function(square) {
            for (var i = 0; i < square.neighborArray.length; i++) {
                var neighbor = square.neighborArray[i];
                var ncell = square.cellNeighborArray[i];
                if((!neighbor.uncovered) && (neighbor.mineCount !== 0)) {
                    $(ncell).uncover(neighbor);
                } else if ((!neighbor.uncovered) && (neighbor.mineCount == 0)) {
                    $(ncell).addClass("uncovered");
                    $(ncell).html("");
                    neighbor.uncovered = true;
                    gameInfo.numOpened++;
                    gameInfo.queue.push(ncell);
                    gameInfo.sqQueue.push(neighbor);
                }
            }
            while(gameInfo.queue.length !== 0) {
                $(gameInfo.queue.pop()).bfs(gameInfo.sqQueue.pop());
            }
        };//end of bfs function
        
        
        //uncover function used to reveal whats underneath a cell
        $.fn.uncover = function(square) {
            $(this).addClass("uncovered");
            square.uncovered = true;
            gameInfo.numOpened++
            if (square.booleanMine) {
            	$(this).html(gameInfo.bombPic);
            	$("td.bomb").each(function(i,elem) {
            		$(elem).addClass("uncovered");
            		$(elem).html(gameInfo.bombPic);
            	});
            	$("#start").html(gameInfo.frowny);
            	gameInfo.gameOver=true; 
            } else if (square.mineCount !== 0) {
            	$(this).html(square.mineCount);
            	switch(square.mineCount) {
                        case 1 : 
                            $(this).css("color", "blue");
                            break;
                        case 2 :
                            $(this).css("color", "green");
                            break;
                        case 3 :
                            $(this).css("color", "red");
                            break;
                        case 4 :
                            $(this).css("color", "purple");
                            break;
                        case 5 :
                            $(this).css("color", "maroon");
                            break;
                        case 6 :
                            $(this).css("color", "cyan");
                            break;
                        case 7 :
                            $(this).css("color", "black");
                            break;
                        case 8 :
                            $(this).css("color", "grey");
                            break;
                }
              } else {
              	$(this).bfs(square);
              }
        };//end of uncover function
        
        
        
        //each time a cell is clicked...
        $('td').each(function () {
            $(this).mousedown(function(event) {
                if(!gameInfo.gameOver) {
                    var cell = $(this);
                    var myRow = cell.parent().index();
                    var myCol = cell.index();
                    var square = gameInfo.sqArray[myRow][myCol];
                    if(!square.uncovered) {
                        switch(event.which) {
                            //right click
                            case 1:
                                if (!square.flag) {
                                    cell.uncover(square);
                                    if (gameInfo.gameOver) {
                                        alert("You hit a mine. GAMEOVER!");
                                    }
                                }
                                break;
                            //left click
                            case 3:
                                if (!square.flag) {
                                    cell.html(gameInfo.flagPic);
                                    square.flag = true;
                                    gameInfo.numLeftToFlag--;
                                } else if (square.flag) {
                                    cell.html("");
                                    square.flag = false;
                                    gameInfo.numLeftToFlag++;
                                }
                                gameInfo.updateScore();
                                break;
                            default:
                                break;
                        }
                    }
                    gameInfo.checkWin();
                }
            }); //end of mouseDown
        }); //end of each td
        
    }); //end of document.on
    
});//end of jQuery document.ready