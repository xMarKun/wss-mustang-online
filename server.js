const WebSocket = require('ws');
const nanoid = require('nanoid').nanoid;

const port = 8000;
const wss = new WebSocket.Server({ port });

// 接続しているすべてのクライアントを管理する配列
const clients = {};
const messages = {};

// 自分のIDを通知
messages.notifyId = (userId) => {
  return JSON.stringify({ type: 'notifyId', id: userId });
};
// 新しい車の生成
messages.create = (userId) => {
  return JSON.stringify({ type: 'create', userId });
};
// 既存の車の削除
messages.remove = (userId) => {
  return JSON.stringify({ type: 'remove', userId });
};

wss.on('connection', (ws) => {
  // 新しいクライアントが接続された時の処理
  // クライアントを配列に追加
  const userId = nanoid();
  clients[userId] = ws;

  // 自分のIDを通知
  ws.send(messages.notifyId(userId));

  // 新しい車の生成依頼を送信
  for (let clientId in clients) {
    clients[clientId].send(messages.create(userId));
    if (clientId !== userId) {
      ws.send(messages.create(clientId));
    }
  }

  ws.on('message', (message) => {
    // クライアントからメッセージを受信した時の処理
    // 受信したメッセージをすべてのクライアントに送信（ブロードキャスト）
    for (let clientId in clients) {
      if (clientId === userId) {
        continue;
      }
      clients[clientId].send(message.toString());
    }
  });

  ws.on('close', () => {
    // クライアントが切断された時の処理
    // クライアントを配列から削除
    // const clientId = Object.keys(clients).filter((key) => clients[key] === ws);
    delete clients[userId];
    // 既存の車の削除依頼を送信
    for (let clientId in clients) {
      clients[clientId].send(messages.remove(userId));
    }
  });

  ws.on('error', (err) => {
    console.log(err);
  });
});
