/**************************************************
 モンテカルロ木探索

 https://ja.wikipedia.org/wiki/%E3%83%A2%E3%83%B3%E3%83%86%E3%82%AB%E3%83%AB%E3%83%AD%E6%9C%A8%E6%8E%A2%E7%B4%A2
*************************************************/

const UCT_C = Math.sqrt(2);

function MCTSNode(board, action, parentNode) {
	this.board = board;
	this.action = action;
	this.untriedAction = [];
	this.childNodes = [];
	this.parentNode = parentNode;
	this.count = 0;
	this.wins = [0, 0, 0];
	
	let actions = board.actions();
	for(let i = 0; i < 32; i++) {
		let mask = 1 << i;
		if(actions[0] & mask) {
			this.untriedAction.push([mask, 0]);
		}
		if(actions[1] & mask) {
			this.untriedAction.push([0, mask]);
		}
	}
}

// 未実施の操作の中から1つを選んで子ノードに追加する
MCTSNode.prototype.expandChild = function() {
	let i = Math.floor(Math.random(this.untriedAction.length));
	let m = this.untriedAction.splice(i, 1)[0];
	let board = this.board.clone();
	
	board.reverse(m);
	board.next();
	let child = new MCTSNode(board, m, this);
	this.childNodes.push(child);
	return child;
};

// 子ノードの中から最も優先度の高いノードを選ぶ
MCTSNode.prototype.selectChild = function() {
	const LOG_N = Math.log(this.count);
	
	// childrenのturnは本来this.turn+1だが、rootに登録するボードの状態は黒だが、ターン数は白（黒終了後）というように
	// モンテカルロ木の各ノードで扱っているボードの状態とturn数が1ずれているので、offset の値も1ずらしておく
	const wins_offset = this.board.turn & 1;
	let values = this.childNodes.map(function (n) {
		return (n.wins[wins_offset] + n.wins[2]) / n.count + UCT_C * Math.sqrt(LOG_N / n.count);
	});
	let max = Math.max.apply(null, values);
	let offset = [];
	values.forEach(function(n, i) {
		if(n == max) {
			offset.push(i);
		}
	});
	return this.childNodes[
		offset[Math.floor(Math.random() * offset.length)]
	];
};

// 現在のノードからプレイアウトまでをランダムに実行する
MCTSNode.prototype.simulate = function(tactic) {
	let board = this.board.clone();
	let getBitMask = function(bits) {
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
	};
	while(!board.finished()){
		let m = board.actions();
		if(m[0] || m[1]) {
			m = getBitMask(m);
			
			// 定石を含める場合
			if(tactic) {
				let n = [];
				// 角があれば角に置く
				m.forEach(function(b){
					if(
						b[0] === 1 ||
						b[0] === 1 << 7 ||
						b[1] === 1 << 31 ||
						b[1] === 1 << 24
					) {
						n.push(b);
					}
				});
				if(n.length > 0) {
					m = n;
				}
			}
			
			board.reverse(m[Math.floor(Math.random() * m.length)]);
		}
		board.next();
	}
	
	let count = board.count();
	return count[0] > count[1] ? [1, 0, 0] : count[0] < count[1] ? [0, 1, 0] : [0, 0, 0.5];
};

// プレイアウトの結果を伝搬する
MCTSNode.prototype.backpropagate = function(result) {
	for(let node = this; node !== null; node = node.parentNode) {
		node.wins[0] += result[0];
		node.wins[1] += result[1];
		node.wins[2] += result[2];
		node.count++;
	}
};

// モンテカルロ木検索を実施する
function MonteCarloTreeSearch(board, count, tactic) {
	let root = new MCTSNode(board.clone(), null, null);
	for(let i = 0; i < count; i++) {
		let node = root;
		
		while(node.untriedAction.length === 0 && node.childNodes.length !== 0) {
			node = node.selectChild();
		}
		
		if (node.untriedAction.length !== 0){
			node = node.expandChild();
		}
		
		let result = node.simulate(tactic);
		node.backpropagate(result);
	}
	
	var c = root.childNodes.map(function (n) {return n.count;});
	//*
	root.childNodes.forEach(function(c){
		console.log(c.wins);
		console.log(c.count);
	});
	//*/
	return root.childNodes[c.indexOf(Math.max.apply(null, c))].action;
}