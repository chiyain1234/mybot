const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { Client: UnbClient } = require('unb-api');
const unb = new UnbClient(process.env.UNB_TOKEN);

// SQLiteデータベースを初期化
const db = new sqlite3.Database('./targetNumbers.db', (err) => {
    if (err) {
        console.error('データベースの接続に失敗しました:', err.message);
    } else {
        console.log('データベースに接続しました。');
        // テーブルが存在しない場合は作成
        db.run(`CREATE TABLE IF NOT EXISTS targetNumbers (
            date TEXT PRIMARY KEY,
            number INTEGER
        )`);
    }
});

// 巨大な数をランダムに生成する関数
function generateNumber() {
    const byteLength = 16; // 128ビットのバイト数 (16バイト = 128ビット)
    const randomBytes = crypto.randomBytes(byteLength); // ランダムな16バイトを生成

    // ランダムバイト列を16進数文字列に変換
    const randomHex = randomBytes.toString('hex');
    const randomInt = parseInt(randomHex, 16);

    const maxNumber = 10 ** 15; // 20桁の範囲に制限
    return randomInt % maxNumber; // 余りを使って20桁の数に収める
}

// 今日の目標の数を取得
async function getTodayTargetNumber() {
    return new Promise((resolve, reject) => {
        const today = "numbers"; // 固定値として "numbers" を使用

        db.get(`SELECT number FROM targetNumbers WHERE date = ?`, [today], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (!row) {
                    // データがなければ新しい数を生成して保存
                    resetTargetNumber().then(() => {
                        // 新しい数を取得して返す
                        resolve(generateNumber());
                    }).catch(reject);
                } else {
                    resolve(parseInt(row.number, 10)); // 取得時に整数に変換
                }
            }
        });
    });
}

// 今日の目標の数をリセットする（ユーザーが正解した場合にのみ呼び出される）
async function resetTargetNumber() {
    const today = "numbers";
    const newTarget = generateNumber();
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO targetNumbers (date, number) VALUES (?, ?)`, [today, newTarget], (err) => {
            if (err) {
                console.error('数のリセットに失敗しました:', err);
                reject(err);
            } else {
                console.log(`新しい目標の数字は: ${newTarget}`);
                resolve();
            }
        });
    });
}

// 数当てゲームのロジック
const guessNumber = async (client, message) => {
    if (message.author.bot) return; // ボットのメッセージは無視
    if (message.channel.id !== "1298571115211526166") return; // 特定のチャンネル以外は無視
    const user = message.author.id;
    const guildId = message.guild.id;

    const userNumber = parseInt(message.content.trim(), 10); // 入力を整数に変換
    const { MessageEmbed } = require("discord.js");
    
    if (isNaN(userNumber)) {
        // 数字以外が送信された場合は無視
        return;
    }

    try {
        // 今日の目標の数を取得
        let targetNumber = await getTodayTargetNumber();

        // 数字の判定と応答メッセージ
        if (userNumber === targetNumber) {
            const randomPercentage = 50;
            const userBalance = await unb.getUserBalance(message.guild.id, message.author.id);
            const bal = Math.floor((randomPercentage / 100) * userBalance.total);
            const avatarUrl = message.author.displayAvatarURL({ dynamic: true, size: 1024 });
          
            const embed = new MessageEmbed()
                .setColor("0xd2b48c")
                .setTitle("数を当てました！")
                .setDescription(`🎉 おめでとう！正解は **${targetNumber.toLocaleString()}** でした！\n<@${message.author.id}> は <:oyo_coin:1296975543140483103>${bal.toLocaleString()} (10%) を獲得しました！`)
                .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
                .setThumbnail(avatarUrl)
                .setTimestamp();

            await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
            await unb.editUserBalance(guildId, user, { cash: bal });
          
            // 正解した場合にのみ数をリセットしデータベースに保存
            await resetTargetNumber();
        } else if (userNumber > targetNumber) {
            message.channel.send(`${userNumber} より小さいです！`);
        } else {
            message.channel.send(`${userNumber} より大きいです！`);
        }
    } catch (err) {
        console.error('エラーが発生しました:', err);
    }
};

module.exports = {
    guessNumber,
};
