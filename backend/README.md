```
npm install
npm run dev
```

```
npm run deploy
```

# 部屋一覧の取得
GET http://localhost:8787/api/rooms

# 部屋を自分のものにする
GET http://localhost:8787/api/rooms/{部屋エイリアスID}/claim

# 部屋の内装情報の取得
GET http://localhost:8787/api/rooms/{部屋エイリアスID}

# 内装の変更
POST http://localhost:8787/api/rooms/interiors
Content-Type: application/json

{
  "loginId": "{ログインID}",
  "interiors": [
    { "type": "sofa", "pattern": 2 },
    { "type": "table", "pattern": 3 }
  ]
}

# プレイリストの更新
POST http://localhost:8787/api/rooms/playlists
Content-Type: application/json

{
  "loginId": "{ログインID}",
  "playlists": [
    "https://example.com/playlist1",
    "https://example.com/playlist2"
  ]
}
