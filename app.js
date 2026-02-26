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


const TAROT_SYMBOL = {
  '大アルカナ': '✨', 'ワンド': '🔥', 'カップ': '💧', 'ソード': '⚡', 'ペンタクル': '🌿',
};
const ORACLE_SYMBOLS = ['🌙','⭐','🌸','🦋','🌺','🌈','🔮','🌟','💎','🌊','☀️','🌿'];

/* ═══════════════════════════════════════════
   設定 / APIキー管理
═══════════════════════════════════════════ */

const API_PROXY = 'http://localhost:8888';
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
  "gender": "相談者の性別（女性／男性／不明）",
  "partner_gender": "相手の性別（女性／男性／不明）",
  "relationship": "相手との関係性（例：交際中の彼氏／元カレ／片思いの相手／マッチングアプリで知り合った男性／など。具体的に）",
  "status": "現在の状況を具体的事実ベースで（例：交際2年目、3月から遠距離予定、最近連絡頻度が減少、先日「カフェで話したい」と言われた、など。事実を時系列で箇条書き）",
  "theme": "鑑定テーマを一言で（例：彼の気持ち／復縁の可能性／カフェで話される内容の本音）",
  "deepest_fear": "相談者が一番怖いと感じていること・最も不安に思っていること（例：別れ話をされること、気持ちの温度差を突きつけられること、など。LINEの文面から感情レベルで読み取る）",
  "summary": "相談内容の要約（3〜5文で具体的に。事実だけでなく、相談者がどんな感情状態にあるかも含める）",
  "personality": "相談者の性格・特徴（文章から読み取れること。例：相手の気持ちを先回りして考えるタイプ、不安を一人で抱え込みやすい、芯は強いが表に出さない、など）",
  "strengths": "相談者の愛される資質・強さ（例：怖いのに逃げずに向き合おうとしている、遠距離も覚悟できるほど愛情が深い、など。鑑定文のオープニングで肯定するために使用する）",
  "unconfirmed": "鑑定前に確認しておくべき未確認事項（複数あれば改行区切りで列挙）"
}`;

  try {
    // ローカルプロキシ経由で送信（CORS回避）
    const apiUrl = `${API_PROXY}/v1/messages`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const responseText = await res.text();
    console.log(`[Profiling] status=${res.status}, body=`, responseText);

    if (!res.ok) {
      let msg = `HTTPエラー ${res.status}`;
      try {
        const err = JSON.parse(responseText);
        msg = err?.error?.message || msg;
      } catch (_) { /* JSONでない場合はそのまま */ }
      if (res.status === 401) {
        throw new Error('APIキーが無効です。設定画面でキーを確認してください。');
      }
      throw new Error(`${msg}\n\n[レスポンス]\n${responseText.slice(0, 500)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[Profiling] JSONパース失敗:', responseText);
      throw new Error(`APIレスポンスのJSONパースに失敗しました。\n\n[レスポンス先頭500文字]\n${responseText.slice(0, 500)}`);
    }

    let raw = data?.content?.[0]?.text || '';
    console.log('[Profiling] Claude応答テキスト:', raw);

    // マークダウンのコードブロックを除去
    raw = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();

    // JSON部分を抽出
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Profiling] JSON抽出失敗。応答全文:', raw);
      throw new Error(`APIの応答からJSONを読み取れませんでした。\n\n[応答テキスト先頭500文字]\n${raw.slice(0, 500)}`);
    }

    profileData = JSON.parse(jsonMatch[0]);
    displayProfile(profileData);

    // カードが既に引かれている場合はプロンプトを再生成
    if (drawnCards) await generatePrompt();

  } catch (e) {
    console.error('[Profiling] エラー:', e);
    showAlert(`エラー：${e.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 プロファイリング実行';
  }
}

function displayProfile(p) {
  document.getElementById('pName').textContent         = p.name            || '—';
  document.getElementById('pGender').textContent       = p.gender          || '—';
  document.getElementById('pRelationship').textContent = (p.partner_gender && p.relationship)
    ? `${p.partner_gender} / ${p.relationship}`
    : p.relationship || '—';
  document.getElementById('pStatus').textContent       = p.status          || '—';
  document.getElementById('pTheme').textContent        = p.theme           || '—';
  document.getElementById('pFear').textContent         = p.deepest_fear    || '—';
  document.getElementById('pSummary').textContent      = p.summary         || '—';
  document.getElementById('pPersonality').textContent  = p.personality     || '—';
  document.getElementById('pStrengths').textContent    = p.strengths       || '—';
  document.getElementById('pUnconfirmed').textContent  = p.unconfirmed     || '—';

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

async function drawCards() {
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
  await generatePrompt();
  document.getElementById('promptSection').classList.add('show');

  setTimeout(() => {
    document.getElementById('cardStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/* ═══════════════════════════════════════════
   プロンプト生成
═══════════════════════════════════════════ */

function getOracleDetail(cardDisplayName, position) {
  const card = ORACLE_CARDS.find(c => c.displayName === cardDisplayName);
  if (!card) return null;
  const animalName = cardDisplayName.split('と')[0];
  return {
    animalName: animalName,
    keyword: card.keyword_ja,
    meaning: position === '正位置' ? card.upright : card.reversed,
  };
}

async function generatePrompt() {
  try {
    const res = await fetch('prompt-template.txt');
    if (!res.ok) throw new Error(`テンプレートの読み込みに失敗しました（HTTP ${res.status}）`);
    let template = await res.text();

    const p = profileData || {};
    const { top, bottom } = drawnCards;

    // プロファイル情報のプレースホルダー
    const relationship = (p.partner_gender && p.relationship)
      ? `${p.partner_gender} / ${p.relationship}`
      : p.relationship || '不明';

    const replacements = {
      '{name}':          p.name          || '不明',
      '{gender}':        p.gender        || '不明',
      '{relationship}':  relationship,
      '{status}':        p.status        || '不明',
      '{theme}':         p.theme         || '不明',
      '{deepest_fear}':  p.deepest_fear  || '不明',
      '{summary}':       p.summary       || '不明',
      '{personality}':   p.personality   || '不明',
      '{strengths}':     p.strengths     || '不明',
      '{unconfirmed}':   p.unconfirmed   || '不明',
      // タロットカード
      '{upper_tarot}':   `${top[0].name}（${top[0].pos}）`,
      '{lower_tarot}':   `${bottom[0].name}（${bottom[0].pos}）`,
      // オラクルカード（名前＋位置）
      '{upper_oracle_1}': `${top[1].name}（${top[1].pos}）`,
      '{upper_oracle_2}': `${top[2].name}（${top[2].pos}）`,
      '{lower_oracle_1}': `${bottom[1].name}（${bottom[1].pos}）`,
      '{lower_oracle_2}': `${bottom[2].name}（${bottom[2].pos}）`,
    };

    // オラクルカード詳細情報（4枚分）
    const oracleSlots = [
      { prefix: 'upper_oracle_1', card: top[1] },
      { prefix: 'upper_oracle_2', card: top[2] },
      { prefix: 'lower_oracle_1', card: bottom[1] },
      { prefix: 'lower_oracle_2', card: bottom[2] },
    ];

    for (const slot of oracleSlots) {
      const detail = getOracleDetail(slot.card.name, slot.card.pos);
      replacements[`{${slot.prefix}_animal_name}`] = detail ? detail.animalName : slot.card.name;
      replacements[`{${slot.prefix}_keyword}`]     = detail ? detail.keyword    : '不明';
      replacements[`{${slot.prefix}_meaning}`]     = detail ? detail.meaning    : '不明';
    }

    // プレースホルダーを置換
    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replaceAll(placeholder, value);
    }

    document.getElementById('promptText').value = template;

  } catch (e) {
    document.getElementById('promptText').value = `エラー：${e.message}`;
  }
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
