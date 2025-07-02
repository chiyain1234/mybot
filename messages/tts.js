const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require("fs").promises;

// メッセージ処理
const TTS = async (message) => {

const TTSChannel = "1357237913108348968"; // TTSを有効にするチャンネルID
const model = "playai-tts";
const voice = "Arista-PlayAI";
const responseFormat = "wav";

  if (message.author.bot) return;
  if (message.channel.id !== TTSChannel) return;

  const text = message.content;
  if (!text) return;

  // 一時的なWAVファイルパス
  const speechFilePath = `./speech-${message.id}.wav`;

  try {
    // TTS APIを呼び出して音声を生成
    const response = await groq.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: responseFormat
    });

    // バッファを取得し、ファイルに保存
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(speechFilePath, buffer);

    // 生成したWAVファイルをDiscordに送信
    await message.channel.send({
      content: `🔊 **TTS音声:** ${text}`,
      files: [speechFilePath]
    });

    // 送信後にファイルを削除
    fs.unlink(speechFilePath, (err) => {
      if (err) console.error("ファイル削除エラー:", err);
    });
  } catch (error) {
    console.error("TTS生成エラー:", error);
    await message.reply("⚠️ TTSの生成に失敗しました。");
    console.log(groq.audio); // undefined なら API の実装を確認
  }
}
module.exports = { TTS };