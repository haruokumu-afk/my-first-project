/* ═══════════════════════════════════════════
   データ定義
═══════════════════════════════════════════ */

// タロット 78枚
const TAROT = [
  // 大アルカナ（22枚）
  '愚者（0）', '魔術師（Ⅰ）', '女教皇（Ⅱ）', '女帝（Ⅲ）', '皇帝（Ⅳ）',
  '教皇（Ⅴ）', '恋人たち（Ⅵ）', '戦車（Ⅶ）', '力（Ⅷ）', '隠者（Ⅸ）',
  '運命の輪（Ⅹ）', '正義（Ⅺ）', '吊るされた男（Ⅻ）', '死神（ⅩⅢ）',
  '節制（ⅩⅣ）', '悪魔（ⅩⅤ）', '塔（ⅩⅥ）', '星（ⅩⅦ）', '月（ⅩⅧ）',
  '太陽（ⅩⅨ）', '審判（ⅩⅩ）', '世界（ⅩⅪ）',
  // ワンド（14枚）
  'ワンドのエース', 'ワンドの2', 'ワンドの3', 'ワンドの4', 'ワンドの5',
  'ワンドの6', 'ワンドの7', 'ワンドの8', 'ワンドの9', 'ワンドの10',
  'ワンドのペイジ', 'ワンドのナイト', 'ワンドのクイーン', 'ワンドのキング',
  // カップ（14枚）
  'カップのエース', 'カップの2', 'カップの3', 'カップの4', 'カップの5',
  'カップの6', 'カップの7', 'カップの8', 'カップの9', 'カップの10',
  'カップのペイジ', 'カップのナイト', 'カップのクイーン', 'カップのキング',
  // ソード（14枚）
  'ソードのエース', 'ソードの2', 'ソードの3', 'ソードの4', 'ソードの5',
  'ソードの6', 'ソードの7', 'ソードの8', 'ソードの9', 'ソードの10',
  'ソードのペイジ', 'ソードのナイト', 'ソードのクイーン', 'ソードのキング',
  // ペンタクル（14枚）
  'ペンタクルのエース', 'ペンタクルの2', 'ペンタクルの3', 'ペンタクルの4', 'ペンタクルの5',
  'ペンタクルの6', 'ペンタクルの7', 'ペンタクルの8', 'ペンタクルの9', 'ペンタクルの10',
  'ペンタクルのペイジ', 'ペンタクルのナイト', 'ペンタクルのクイーン', 'ペンタクルのキング',
];

// オラクル 52枚
const ORACLE = [
  '愛の光', '信頼', '解放', '変容', '豊かさ', '内なる知恵', '新しい始まり',
  '守護', '直感', '癒し', '感謝', '奇跡', '平和', '勇気', '創造性', '繁栄',
  '調和', '喜び', '自由', '浄化', '成長', '希望', '強さ', '慈悲', '夢',
  '真実', 'バランス', '導き', '受容', '再生', '祝福', '明晰さ', '情熱',
  '忍耐', '成功', '神聖な愛', '霊的覚醒', '豊穣', '深いつながり', '内省',
  '変化の風', '流れに乗る', '境界線', '自己愛', '好奇心', '聖なる女性性',
  '神聖な男性性', '統合', '手放し', '新しい章', '光の目覚め', '奇跡の種',
];

const TAROT_SYMBOL = {
  '大アルカナ': '✨', 'ワンド': '🔥', 'カップ': '💧', 'ソード': '⚡', 'ペンタクル': '🌿',
};
const ORACLE_SYMBOLS = ['🌙','⭐','🌸','🦋','🌺','🌈','🔮','🌟','💎','🌊','☀️','🌿'];

/* ═══════════════════════════════════════════
   設定 / APIキー管理
═══════════════════════════════════════════ */

const API_KEY_STORAGE = 'tarot_claude_api_key';

function openSettings() {
  const key = localStorage.getItem(API_KEY_STORAGE) || '';
  document.getElementById('apiKeyInput').value = key;
  document.getElementById('apiSavedNotice').classList.remove('show');
  document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('settingsModal')) closeSettings();
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  localStorage.setItem(API_KEY_STORAGE, key);
  document.getElementById('apiSavedNotice').classList.add('show');
  setTimeout(() => {
    document.getElementById('apiSavedNotice').classList.remove('show');
  }, 2000);
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

// Esc キーでモーダルを閉じる
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSettings();
});

/* ═══════════════════════════════════════════
   プロファイリング（Claude API）
═══════════════════════════════════════════ */

let profileData = null;

function showAlert(html, type = 'error') {
  const el = document.getElementById('profilingAlert');
  el.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
}

function clearAlert() {
  document.getElementById('profilingAlert').innerHTML = '';
}

async function runProfiling() {
  const lineText = document.getElementById('lineText').value.trim();
  if (!lineText) {
    showAlert('LINEのやり取りを貼り付けてください。');
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    showAlert(
      'Claude APIキーが設定されていません。<br/>' +
      '画面右上の <strong>⚙️</strong> からAPIキーを入力・保存してください。',
      'info'
    );
    return;
  }

  // ローディング状態
  const btn = document.getElementById('profileBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 解析中...';
  clearAlert();
  document.getElementById('profileResult').classList.remove('show');

  const prompt = `以下のLINEトーク履歴を分析して、タロット占い師が鑑定を行うために必要な情報を抽出してください。

【LINEトーク履歴】
${lineText}

以下のJSON形式のみで回答してください（説明文は不要）。値が不明・読み取れない場合は "不明" と記入してください。

{
  "name": "相談者の名前（ニックネームでも可）",
  "status": "現在の状況（例：交際中／復縁希望／片思い／既婚者との恋愛／など）",
  "theme": "鑑定テーマを一言で（例：彼の気持ち／復縁の可能性／恋愛の進展など）",
  "summary": "相談内容の要約（3〜5文で具体的に）",
  "personality": "相談者の性格・特徴（文章から読み取れること。感情的／論理的／不安が強い等）",
  "unconfirmed": "鑑定前に確認しておくべき未確認事項（複数あれば改行区切りで列挙）"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTPエラー ${res.status}`;
      if (res.status === 401) {
        throw new Error('APIキーが無効です。設定画面でキーを確認してください。');
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const raw = data?.content?.[0]?.text || '';

    // JSON部分を抽出
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('APIの応答からJSONを読み取れませんでした。');

    profileData = JSON.parse(jsonMatch[0]);
    displayProfile(profileData);

    // カードが既に引かれている場合はプロンプトを再生成
    if (drawnCards) generatePrompt();

  } catch (e) {
    showAlert(`エラー：${e.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 プロファイリング実行';
  }
}

function displayProfile(p) {
  document.getElementById('pName').textContent        = p.name        || '—';
  document.getElementById('pStatus').textContent     = p.status      || '—';
  document.getElementById('pTheme').textContent      = p.theme       || '—';
  document.getElementById('pSummary').textContent    = p.summary     || '—';
  document.getElementById('pPersonality').textContent = p.personality || '—';
  document.getElementById('pUnconfirmed').textContent = p.unconfirmed || '—';

  document.getElementById('profileResult').classList.add('show');

  setTimeout(() => {
    document.getElementById('profileResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 80);
}

/* ═══════════════════════════════════════════
   ユーティリティ
═══════════════════════════════════════════ */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) { return shuffle(arr).slice(0, n); }

function randomPosition() { return Math.random() < 0.5 ? '正位置' : '逆位置'; }

function getSymbol(cardName) {
  if (ORACLE.includes(cardName)) {
    return ORACLE_SYMBOLS[Math.floor(Math.random() * ORACLE_SYMBOLS.length)];
  }
  const idx = TAROT.indexOf(cardName);
  if (idx < 22) return TAROT_SYMBOL['大アルカナ'];
  if (idx < 36) return TAROT_SYMBOL['ワンド'];
  if (idx < 50) return TAROT_SYMBOL['カップ'];
  if (idx < 64) return TAROT_SYMBOL['ソード'];
  return TAROT_SYMBOL['ペンタクル'];
}

/* ═══════════════════════════════════════════
   カードを引く
═══════════════════════════════════════════ */

let drawnCards = null;

function drawCards() {
  const [t1, t2] = pick(TAROT, 2).map(c => ({ name: c, pos: randomPosition(), isTarot: true }));
  const [o1, o2, o3, o4] = pick(ORACLE, 4).map(c => ({ name: c, pos: randomPosition(), isTarot: false }));

  const topCards    = [t1, o1, o2];
  const bottomCards = [t2, o3, o4];
  drawnCards = { top: topCards, bottom: bottomCards };

  const topRow    = document.getElementById('topRow');
  const bottomRow = document.getElementById('bottomRow');
  topRow.innerHTML    = '';
  bottomRow.innerHTML = '';

  [...topCards, ...bottomCards].forEach((card, i) => {
    const row    = i < 3 ? topRow : bottomRow;
    const sym    = getSymbol(card.name);
    const rev    = card.pos === '逆位置';
    const tClass = card.isTarot ? 'tarot-card' : 'oracle-card';
    const badge  = card.isTarot ? 'タロット' : 'オラクル';
    row.innerHTML += `
      <div class="card-item ${tClass}${rev ? ' reversed-card' : ''}">
        <div class="card-type-badge">${badge}</div>
        <span class="card-symbol">${sym}</span>
        <div class="card-name">${card.name}</div>
        <span class="card-position ${rev ? 'pos-reversed' : 'pos-upright'}">${card.pos}</span>
      </div>`;
  });

  document.getElementById('cardStage').classList.add('show');
  generatePrompt();
  document.getElementById('promptSection').classList.add('show');

  setTimeout(() => {
    document.getElementById('cardStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/* ═══════════════════════════════════════════
   プロンプト生成
═══════════════════════════════════════════ */

function generatePrompt() {
  const p = profileData || {};
  const name        = p.name        || '（未プロファイリング）';
  const status      = p.status      || '（未プロファイリング）';
  const theme       = p.theme       || '（未プロファイリング）';
  const summary     = p.summary     || '（未プロファイリング）';
  const personality = p.personality || '（未プロファイリング）';
  const unconfirmed = p.unconfirmed || '（なし）';

  const { top, bottom } = drawnCards;
  const fmt = (c) => `${c.name}（${c.pos}）`;

  const prompt = `あなたはプロのタロット占い師です。以下の情報をもとに、相談者に寄り添った丁寧で深みのある鑑定文を作成してください。

━━━━━━━━━━━━━━━━━━━━━━
【相談者情報】
━━━━━━━━━━━━━━━━━━━━━━
お名前　　　：${name}
現在の状況　：${status}
鑑定テーマ　：${theme}
相談内容　　：${summary}
性格・特徴　：${personality}
未確認事項　：${unconfirmed}

━━━━━━━━━━━━━━━━━━━━━━
【カード結果】
━━━━━━━━━━━━━━━━━━━━━━
▲ 上段（現状・課題）
  ・タロット  ：${fmt(top[0])}
  ・オラクル① ：${fmt(top[1])}
  ・オラクル② ：${fmt(top[2])}

▼ 下段（アドバイス・未来の可能性）
  ・タロット  ：${fmt(bottom[0])}
  ・オラクル③ ：${fmt(bottom[1])}
  ・オラクル④ ：${fmt(bottom[2])}

━━━━━━━━━━━━━━━━━━━━━━
【鑑定文作成の指針】
━━━━━━━━━━━━━━━━━━━━━━
1. 冒頭で相談内容と鑑定テーマへの共感を示し、引いたカードの全体的な印象を伝えてください。

2. 【上段のメッセージ】
   上段3枚のカード（現状・課題）を解釈してください。
   ・タロットカードが示す現在の状況や核心
   ・2枚のオラクルカードが加えるスピリチュアルなメッセージ
   ・3枚を統合した「今あなたが置かれている状況」のリーディング

3. 【下段のメッセージ】
   下段3枚のカード（アドバイス・未来）を解釈してください。
   ・タロットカードが示す転換点や未来の方向性
   ・2枚のオラクルカードが伝える行動のヒントや宇宙からのサポート
   ・3枚を統合した「これからのあなたへのガイダンス」のリーディング

4. まとめとして、上段と下段のメッセージを融合させ、相談者へのエールと前向きなメッセージで締めくくってください。

【文体の注意点】
- 温かく、相談者に寄り添うトーンで
- 相談者の性格・特徴（${personality}）を踏まえた表現を心がける
- 断定的すぎず、可能性を広げる表現を使う
- 相談者が自分で決断できるよう後押しするメッセージを心がける
- 敬語（丁寧語）で統一する
- 分量の目安：全体で1,000〜1,500字程度`;

  document.getElementById('promptText').value = prompt;
}

/* ═══════════════════════════════════════════
   コピー
═══════════════════════════════════════════ */

function copyPrompt() {
  const text = document.getElementById('promptText').value;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    showCopyNotice();
  }).catch(() => {
    const ta = document.getElementById('promptText');
    ta.select();
    document.execCommand('copy');
    showCopyNotice();
  });
}

function showCopyNotice() {
  const notice = document.getElementById('copyNotice');
  notice.classList.add('show');
  setTimeout(() => notice.classList.remove('show'), 2500);
}
