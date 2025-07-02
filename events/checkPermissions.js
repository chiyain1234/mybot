const { MessageEmbed } = require("discord.js");

const permissionTranslations = {
    "ADMINISTRATOR": "管理者",
    "CREATE_INSTANT_INVITE": "招待を作成",
    "KICK_MEMBERS": "メンバーをキック",
    "BAN_MEMBERS": "メンバーをBAN",
    "MANAGE_CHANNELS": "チャンネルの管理",
    "MANAGE_GUILD": "サーバーの管理",
    "ADD_REACTIONS": "リアクションの追加",
    "VIEW_AUDIT_LOG": "監査ログを見る",
    "PRIORITY_SPEAKER": "優先スピーカー",
    "STREAM": "動画",
    "VIEW_CHANNEL": "チャンネルを見る",
    "SEND_MESSAGES": "メッセージを送信",
    "SEND_TTS_MESSAGES": "TTSメッセージを送信",
    "MANAGE_MESSAGES": "メッセージの管理",
    "EMBED_LINKS": "埋め込みリンク",
    "ATTACH_FILES": "ファイルを添付",
    "READ_MESSAGE_HISTORY": "メッセージ履歴を読む",
    "MENTION_EVERYONE": "全員にメンション",
    "USE_EXTERNAL_EMOJIS": "外部の絵文字を使用",
    "VIEW_GUILD_INSIGHTS": "サーバーインサイトを見る",
    "CONNECT": "接続",
    "SPEAK": "発言",
    "MUTE_MEMBERS": "メンバーをミュート",
    "DEAFEN_MEMBERS": "メンバーを聞き専にする",
    "MOVE_MEMBERS": "メンバーを移動",
    "USE_VAD": "音声検出を使用",
    "CHANGE_NICKNAME": "ニックネームを変更",
    "MANAGE_NICKNAMES": "ニックネームの管理",
    "MANAGE_ROLES": "ロールの管理",
    "MANAGE_WEBHOOKS": "Webhookの管理",
    "MANAGE_EMOJIS_AND_STICKERS": "絵文字とステッカーの管理",
    "USE_APPLICATION_COMMANDS": "アプリケーションコマンドを使用",
    "REQUEST_TO_SPEAK": "スピーカーとして参加をリクエスト",
    "MANAGE_EVENTS": "イベントの管理",
    "MANAGE_THREADS": "スレッドの管理",
    "CREATE_PUBLIC_THREADS": "公開スレッドを作成",
    "CREATE_PRIVATE_THREADS": "プライベートスレッドを作成",
    "USE_EXTERNAL_STICKERS": "外部ステッカーを使用",
    "SEND_MESSAGES_IN_THREADS": "スレッド内でメッセージを送信",
    "START_EMBEDDED_ACTIVITIES": "埋め込みアクティビティを開始",
    "MODERATE_MEMBERS": "メンバーのタイムアウト",
    "VIEW_CREATOR_MONETIZATION_ANALYTICS": "クリエイターモネタイズ分析を表示",
    "USE_SOUNDBOARD": "サウンドボードを使用",
    "SEND_VOICE_MESSAGES": "ボイスメッセージを送信"
};

const checkPermissions = (command, interaction, client) => {
    const getPermissionTranslation = (perm) => {
        return permissionTranslations[perm] || "不明な権限";
    };

    if (command.userPerm && !interaction.member.permissions.has(command.userPerm)) {
        const Deembed = new MessageEmbed()
            .setTitle("エラー")
            .setDescription(`あなたはこのコマンドを使う権限をもっていません。\n必要な権限: **${getPermissionTranslation(command.userPerm)}**`)
            .setColor("RED")
            .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTimestamp()
            .setFooter({ text: interaction.toString() });
        interaction.reply({ embeds: [Deembed], ephemeral: true });
        return false;
    }

    if (command.botPerm && !interaction.guild.members.me.permissions.has(command.botPerm)) {
        const Deembed = new MessageEmbed()
            .setTitle("エラー")
            .setDescription(`ボットにこのコマンドを使う権限がありません。\n必要な権限: **${getPermissionTranslation(command.botPerm)}**`)
            .setColor("RED")
            .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTimestamp()
            .setFooter({ text: interaction.toString() });
        interaction.reply({ embeds: [Deembed], ephemeral: true });
        return false;
    }

    return true;
};

module.exports = checkPermissions;
