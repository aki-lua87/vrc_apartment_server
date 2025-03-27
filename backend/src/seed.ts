// ランダムなIDを生成する関数
function generateRandomId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 部屋番号を生成する関数（0001〜9999）
function generateRoomNumber(num: number): string {
  return num.toString().padStart(4, '0');
}

// デフォルトの部屋名を生成する関数
function generateDefaultRoomName(roomNumber: string): string {
  return `room ${roomNumber}`;
}

// SQLファイルを生成する関数
function generateSeedSQL(): string {
  // SQLファイルにはSQLコマンドのみを含める
  let sql = '-- 部屋データのシードSQL\n\n';

  // 部屋データの作成（例として100部屋）
  for (let i = 1; i <= 10000; i++) {
    const roomNumber = generateRoomNumber(i);
    const roomName = generateDefaultRoomName(roomNumber);
    const roomAliasId = generateRandomId();
    const loginId = generateRandomId();

    sql += `INSERT INTO rooms (room_number, room_name, room_alias_id, login_id, is_occupied) VALUES ('${roomNumber}', '${roomName}', '${roomAliasId}', '${loginId}', 0);\n`;
  }

  return sql;
}

// メイン処理
function main(): void {
  // SQLを生成
  const sql = generateSeedSQL();

  // SQLをstdoutに出力（これがファイルに保存される）
  console.log(sql);
}

// メイン処理の実行
main();
