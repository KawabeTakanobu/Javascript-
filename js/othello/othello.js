'use strict';

const BOARD_SIZE = 8;
var cellSize = 64;
var curTurn = true;
var level = 100;

var rev = new ReversiBitBoard();

// ボードの状態を描画する
function refreshBoard() {
	var m = rev.actions();
	$('#game-area .board-cell').each(function(){
		var p0 = $(this).data('pos0');
		var p1 = $(this).data('pos1');
		
		// ボードを緑で塗りつぶす
		var ctx = this.getContext('2d');
		ctx.fillStyle = 'rgb(0, 128, 0)';
		ctx.fillRect(0, 0, cellSize, cellSize);
		ctx.strokeStyle = 'rgb(0, 0, 0)';
		ctx.strokeRect(0, 0, cellSize, cellSize);
		
		if(rev.board[1][0] & p0 || rev.board[1][1] & p1) {
			// 白丸
			ctx.beginPath();
			ctx.arc(cellSize / 2, cellSize / 2, cellSize / 3, 0 * Math.PI / 180, 360 * Math.PI / 180, false) ;
			ctx.fillStyle = 'rgb(255,255,255)';
			ctx.fill();
		}
		if(rev.board[0][0] & p0 || rev.board[0][1] & p1) {
			// 黒丸
			ctx.beginPath();
			ctx.arc(cellSize / 2, cellSize / 2, cellSize / 3, 0 * Math.PI / 180, 360 * Math.PI / 180, false) ;
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.fill();
		}
		if(p0 & m[0] || p1 & m[1]) {
			ctx.beginPath();
			ctx.arc(cellSize / 2, cellSize / 2, cellSize / 6, 0 * Math.PI / 180, 360 * Math.PI / 180, false) ;
			ctx.fillStyle = rev.turn & 1 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
			ctx.fill();
		}
	});
}

function getBitMask(bits) {
	var retVal = [];
	for(var i = 0; i < 32; i++) {
		var mask = 1 << i;
		if(bits[0] & mask) {
			retVal.push([ mask , 0 ]);
		}
		if(bits[1] & mask) {
			retVal.push([ 0, mask ]);
		}
	}
	return retVal;
}

// 相手のターン
//*
function opponentTurn(board, depth) {
	let m = board.actions();
	if(!m[0] && !m[1]) {
		return false;
	}
	var result = [];
	var masks = getBitMask(m);
	depth = Math.ceil(depth / masks.length);
	$.each(masks, function(){
		var win = 0;
		for(let i = 0; i < depth; i++) {
			// ゲーム終了までランダムに石を置いて行って、最終スコアを計算する
			
			// ボードの状態をコピーする
			var tmpBoard = board.clone();
			
			// 所定の場所に最初の石を置く
			tmpBoard.reverse(this);
			tmpBoard.next();
			
			// おけなくなるまでランダムにおいていく
			while(!tmpBoard.finished()){
				var n = getBitMask(tmpBoard.actions())
				if(n.length > 0) {
					var m = [];
					// 角があれば角に置く
					$.each(n, function(){
						if(
							this[0] === 1 ||
							this[0] === 1 << 7 ||
							this[1] === 1 << 31 ||
							this[1] === 1 << 24
						) {
							m.push(this);
						}
					});
					if(m.length > 0) {
						n = m;
					}
					n = n[Math.floor(Math.random() * n.length)];
					tmpBoard.reverse(n);
				}
				tmpBoard.next();
			}
			var score = tmpBoard.count();
			if(score[1] > score[0]) {
				win++;
			}
		}
		result.push({
			pos: this,
			rate: win / depth
		});
	});
	// 打てる手がなかった
	if(result.length <= 0) {
		return false;
	}
	
	// 勝率の高い順にソートする
	result.sort(function(a, b) {
		return b.rate - a.rate;
	});
	
	// 一番勝率の高いXYに石を置く
	console.log(board.turn + ':' + result[0].pos[0] + ',' + result[0].pos[1]);
	board.reverse(result[0].pos);
	return true;
}
//*/

function gameOver() {
	setTimeout(function() {
		var score = rev.count();
		if(confirm(
			(score[0] > score[1] ? 'あなたの勝ち' : score[0] < score[1] ? 'あなたの負け': '引き分け') + 
			'\r\n黒：' + score[0] + '\r\n白：' + score[1] + '\r\nもう一度ちょうせんしますか？')
		) {
			initilize();
			refreshBoard();
		}
		else {
			window.location.href = 'index.html';
		}
	}, 1000);
}

$('#game-area').on('click', '.board-cell', function(){
	if(rev.turn & 1) {
		return false;
	}
	var isZero = function(m) {
		return !m[0] && !m[1];
	};
	let p = [ $(this).data('pos0'), $(this).data('pos1') ];
	let m = rev.actions();

	if(isZero(m)) {
		// 石を置ける場所がない（本来なら来ない経路）
	}
	else if( p[0] & m[0] || p[1] & m[1] ) {
		rev.reverse(p);
		rev.next();
		refreshBoard();
		
		if(rev.finished()) {
			gameOver();
			return true;
		}
		
		var timerProc = function(){
			//opponentTurn(rev, level);
			let result = MonteCarloTreeSearch(rev, level, level > 100);
			rev.reverse(result);
			
			rev.next();
			refreshBoard();
			if(rev.finished()){
				gameOver();
				return;
			}
			
			// 次に置ける場所を調べる
			var m = rev.actions();
			if(!m[0] && !m[1]) {
				// おける場所がない場合は再度相手のターン
				rev.next();
				setTimeout(function(){
					alert('石を置ける場所がないため、黒石の手番はスキップされます');
					timerProc();
				}, 500);
			}
		};
		
		if( isZero(rev.actions()) ) {
			setTimeout(function(){
				alert('石を置ける場所がないため、白石の手番はスキップされます');
				rev.next();
				refreshBoard();
			});
		}
		else {
			setTimeout(timerProc, 500);
		}
	}
});

// 画面を初期化する
function setLevel(l){
	level = l;
	$('#menu-container').hide();
	$('#game-container').show();
	
	cellSize = Math.floor((Math.min(document.body.clientWidth, document.body.clientHeight) - 64) / 8);
	var gameAreaSize = cellSize * 8;
	$('#game-area').css({
		width: gameAreaSize + 'px',
		height: gameAreaSize + 'px'
	});
	for(var y = 0; y < 8; y++) {
		var row = $('<div class="board-row" />').appendTo('#game-area');
		for(var x = 0; x < 8; x++) {
			$('<canvas class="board-cell" />').data({
				pos0: y < 4 ? (1 << ( y * 8 + x )) : 0,
				pos1: y < 4 ? 0 : (1 << ( ( y - 4 ) * 8 + x ))
			}).prop({
				width: cellSize,
				height: cellSize
			}).appendTo(row);
		}
	}
	
	initilize();
	refreshBoard();
}

// 設定を初期化する
function initilize(){
	rev = new ReversiBitBoard();
}