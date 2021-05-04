'use strict';

/*****************************************************
  オセロのビットボード
  Javascriptは64bit未対応のため、工夫が必要らしい。
  
  中身は以下を参照
  https://qiita.com/rimol/items/9ed84a4fd4cbfdb83d71
*****************************************************/
function ReversiBitBoard(){
	this.board = [
		[0x10000000, 0x00000008],
		[0x08000000, 0x00000010]
	];
	this.turn = 0;
}

// 内容をコピーして複製する
ReversiBitBoard.prototype.clone = function() {
	var retVal = new ReversiBitBoard();
	
	for(var i = 0; i < 2; i++) {
		for(var j = 0; j < 2; j++) {
			retVal.board[i][j] = this.board[i][j];
		}
	}
	retVal.turn = this.turn;
	
	return retVal;
};

// 石のカウント
ReversiBitBoard.prototype._count = function(board) {
	let x0 = board[0];
	let x1 = board[1];
	let t0 = x1 - (x1 >>> 1 & 0x55555555);
	t0 = (t0 & 0x33333333) + ((t0 & 0xcccccccc) >>> 2);
	let t1 = x0 - (x0 >>> 1 & 0x55555555);
	t0 += (t1 & 0x33333333) + ((t1 & 0xcccccccc) >>> 2);
	t0 = (t0 & 0x0f0f0f0f) + ((t0 & 0xf0f0f0f0) >>> 4);
	return t0 * 0x01010101 >>> 24;
};

// 置ける場所の取得
ReversiBitBoard.prototype._actions = function(board_p, board_o) {
	let p0 = board_p[0];
	let p1 = board_p[1];
	let o0 = board_o[0];
	let o1 = board_o[1];

	let mob1 = 0;
	let mob0 = 0;

	let blank1 = ~(p1 | o1);
	let blank0 = ~(p0 | o0);

	let mo1 = o1 & 0x7e7e7e7e;
	let mo0 = o0 & 0x7e7e7e7e;

	// 右向き
	let ps1 = p1 << 1;
	let ps0 = p0 << 1;

	mob1 = (mo1 + ps1) & blank1 & ~ps1;
	mob0 = (mo0 + ps0) & blank0 & ~ps0;

	// 左向き

	let t0 = p0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;

	mob0 |= t0 >>> 1 & blank0;

	let t1 = p1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;

	mob1 |= t1 >>> 1 & blank1;

	// 上下

	mo1 = o1 & 0x00ffffff;
	mo0 = o0 & 0xffffff00;

	// 下向き
	t0 = p0 << 8 & mo0;
	t0 |= t0 << 8 & mo0;
	t0 |= t0 << 8 & mo0;

	t1 = (p1 << 8 | (t0 | p0) >>> 24) & mo1;
	t1 |= t1 << 8 & mo1;
	t1 |= t1 << 8 & mo1;

	mob1 |= (t1 << 8 | t0 >>> 24) & blank1;
	mob0 |= t0 << 8 & blank0;

	// 上
	t1 = p1 >>> 8 & mo1;
	t1 |= t1 >>> 8 & mo1;
	t1 |= t1 >>> 8 & mo1;

	t0 = (p0 >>> 8 | (t1 | p1) << 24) & mo0;
	t0 |= t0 >>> 8 & mo0;
	t0 |= t0 >>> 8 & mo0;

	mob1 |= t1 >>> 8 & blank1;
	mob0 |= (t0 >>> 8 | t1 << 24) & blank0;

	// 斜め

	mo1 = o1 & 0x007e7e7e;
	mo0 = o0 & 0x7e7e7e00;

	// 右下
	t0 = p0 << 9 & mo0;
	t0 |= t0 << 9 & mo0;
	t0 |= t0 << 9 & mo0;

	t1 = (p1 << 9 | (t0 | p0) >>> 23) & mo1;
	t1 |= t1 << 9 & mo1;
	t1 |= t1 << 9 & mo1;

	mob1 |= (t1 << 9 | t0 >>> 23) & blank1;
	mob0 |= t0 << 9 & blank0;

	// 左上
	t1 = p1 >>> 9 & mo1;
	t1 |= t1 >>> 9 & mo1;
	t1 |= t1 >>> 9 & mo1;

	t0 = (p0 >>> 9 | (t1 | p1) << 23) & mo0;
	t0 |= t0 >>> 9 & mo0;
	t0 |= t0 >>> 9 & mo0;

	mob1 |= t1 >>> 9 & blank1;
	mob0 |= (t0 >>> 9 | t1 << 23) & blank0;

	// 左下
	t0 = p0 << 7 & mo0;
	t0 |= t0 << 7 & mo0;
	t0 |= t0 << 7 & mo0;

	t1 = (p1 << 7 | (t0 | p0) >>> 25) & mo1;
	t1 |= t1 << 7 & mo1;
	t1 |= t1 << 7 & mo1;

	mob1 |= (t1 << 7 | t0 >>> 25) & blank1;
	mob0 |= t0 << 7 & blank0;

	// 右上
	t1 = p1 >>> 7 & mo1;
	t1 |= t1 >>> 7 & mo1;
	t1 |= t1 >>> 7 & mo1;

	t0 = (p0 >>> 7 | (t1 | p1) << 25) & mo0;
	t0 |= t0 >>> 7 & mo0;
	t0 |= t0 >>> 7 & mo0;

	mob1 |= t1 >>> 7 & blank1;
	mob0 |= (t0 >>> 7 | t1 << 25) & blank0;

	return [mob0, mob1];
};

// 上側に置いたときにひっくり返る石の取得
ReversiBitBoard.prototype._reverse1 = function(board_p, board_o, sq_bit) {
	let p0 = board_p[0];
	let p1 = board_p[1];
	let o0 = board_o[0];
	let o1 = board_o[1];

	let f1 = 0;
	let f0 = 0;

	let mo1 = o1 & 0x7e7e7e7e;
	let mo0 = o0 & 0x7e7e7e7e;

	// 左
	let d1 = 0x000000fe * sq_bit;
	let t1 = (mo1 | ~d1) + 1 & d1 & p1;
	f1 = t1 - ((t1 | -t1) >>> 31) & d1;

	// 左上
	d1 = 0x08040200 * sq_bit;
	t1 = (mo1 | ~d1) + 1 & d1 & p1;
	f1 |= t1 - ((t1 | -t1) >>> 31) & d1;

	// 上 マスクは付けてはだめ。
	d1 = 0x01010100 * sq_bit;
	t1 = (o1 | ~d1) + 1 & d1 & p1;
	f1 |= t1 - ((t1 | -t1) >>> 31) & d1;

	// 右上
	d1 = 0x00204080 * sq_bit;
	t1 = (mo1 | ~d1) + 1 & d1 & p1;
	f1 |= t1 - ((t1 | -t1) >>> 31) & d1;

	// 右
	t1 = sq_bit >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;
	t1 |= t1 >>> 1 & mo1;

	f1 |= t1 & -(t1 >>> 1 & p1);

	// 右下
	t1 = sq_bit >>> 9 & mo1;
	t1 |= t1 >>> 9 & mo1;
	t1 |= t1 >>> 9 & mo1;

	let t0 = (t1 | sq_bit) << 23 & mo0;
	t0 |= t0 >>> 9 & mo0;
	t0 |= t0 >>> 9 & mo0;

	let t = t1 >>> 9 & p1 | (t0 >>> 9 | t1 << 23) & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	// 下 敵石にマスクはつけない
	t1 = sq_bit >>> 8 & o1;
	t1 |= t1 >>> 8 & o1;
	t1 |= t1 >>> 8 & o1;

	t0 = (t1 | sq_bit) << 24 & o0;
	t0 |= t0 >>> 8 & o0;
	t0 |= t0 >>> 8 & o0;

	t = t1 >>> 8 & p1 | (t0 >>> 8 | t1 << 24) & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	// 左下
	t1 = sq_bit >>> 7 & mo1;
	t1 |= t1 >>> 7 & mo1;
	t1 |= t1 >>> 7 & mo1;

	t0 = (t1 | sq_bit) << 25 & mo0;
	t0 |= t0 >>> 7 & mo0;
	t0 |= t0 >>> 7 & mo0;

	t = t1 >>> 7 & p1 | (t0 >>> 7 | t1 << 25) & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	return [f0, f1];
};

// 下側に置いたときにひっくり返る石
ReversiBitBoard.prototype._reverse0 =  function(board_p, board_o, sq_bit) {
	let p0 = board_p[0];
	let p1 = board_p[1];
	let o0 = board_o[0];
	let o1 = board_o[1];
	let f1 = 0;
	let f0 = 0;

	let mo1 = o1 & 0x7e7e7e7e;
	let mo0 = o0 & 0x7e7e7e7e;

	// 左
	let d0 = 0x000000fe * sq_bit;
	let t0 = (mo0 | ~d0) + 1 & d0 & p0;
	f0 = t0 - ((t0 | -t0) >>> 31) & d0;

	// 左上
	t0 = sq_bit << 9 & mo0;
	t0 |= t0 << 9 & mo0;
	t0 |= t0 << 9 & mo0;

	let t1 = (t0 | sq_bit) >>> 23 & mo1;
	t1 |= t1 << 9 & mo1;
	t1 |= t1 << 9 & mo1;

	let t = (t1 << 9 | t0 >>> 23) & p1 | t0 << 9 & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	// 上 敵石にマスクはつけない
	t0 = sq_bit << 8 & o0;
	t0 |= t0 << 8 & o0;
	t0 |= t0 << 8 & o0;

	t1 = (t0 | sq_bit) >>> 24 & o1;
	t1 |= t1 << 8 & o1;
	t1 |= t1 << 8 & o1;

	t = (t1 << 8 | t0 >>> 24) & p1 | t0 << 8 & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	// 右上
	t0 = sq_bit << 7 & mo0;
	t0 |= t0 << 7 & mo0;
	t0 |= t0 << 7 & mo0;

	t1 = (t0 | sq_bit) >>> 25 & mo1;
	t1 |= t1 << 7 & mo1;
	t1 |= t1 << 7 & mo1;

	t = (t1 << 7 | t0 >>> 25) & p1 | t0 << 7 & p0;
	t = (t | -t) >> 31;

	f1 |= t1 & t;
	f0 |= t0 & t;

	// 右
	t0 = sq_bit >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;
	t0 |= t0 >>> 1 & mo0;

	f0 |= t0 & -(t0 >>> 1 & p0);

	// 右下
	t0 = sq_bit >>> 9 & mo0;
	t0 |= t0 >>> 9 & mo0;
	f0 |= t0 & -(t0 >>> 9 & p0);

	// 下 敵石マスク無し
	t0 = sq_bit >>> 8 & o0;
	t0 |= t0 >>> 8 & o0;
	f0 |= t0 & -(t0 >>> 8 & p0);

	// 左下
	t0 = sq_bit >>> 7 & mo0;
	t0 |= t0 >>> 7 & mo0;
	f0 |= t0 & -(t0 >>> 7 & p0);

	return [f0, f1];
};

// 石のカウント
ReversiBitBoard.prototype.count = function() {
	return [ this._count(this.board[0]), this._count(this.board[1]) ];
};

// 石を置ける場所の取得
ReversiBitBoard.prototype.actions = function(){
	return this._actions(this.board[ this.turn & 1 ], this.board[ (this.turn + 1) & 1 ]);
};

// 石を置いてひっくり返す
ReversiBitBoard.prototype.reverse = function(sq_bit) {
	let board_p = this.board[ this.turn & 1 ];
	let board_o = this.board[ ( this.turn + 1 ) & 1 ]
	let mask = sq_bit[0] ? this._reverse0(board_p, board_o, sq_bit[0]) : this._reverse1(board_p, board_o, sq_bit[1]);

	board_p[0] |= mask[0] | sq_bit[0];
	board_p[1] |= mask[1] | sq_bit[1];

	board_o[0] ^= mask[0];
	board_o[1] ^= mask[1];
};

// ターンを進める
ReversiBitBoard.prototype.next = function(){
	this.turn++;
};

// 終了判定
ReversiBitBoard.prototype.finished = function(){
	var a0 = this._actions(this.board[0], this.board[1]);
	var a1 = this._actions(this.board[1], this.board[0]);
	return !a0[0] && !a0[1] && !a1[0] && !a1[1];
};