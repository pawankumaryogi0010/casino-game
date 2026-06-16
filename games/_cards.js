// =====================================================================
// _CARDS.JS — Shared deck/card utilities for card-based games
// Loaded once; exposes window.CardUtils
// =====================================================================

(function () {
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const SUITS = ["S", "H", "D", "C"];
  const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
  const SUIT_COLORS = { S: "#e5e7eb", C: "#e5e7eb", H: "#f87171", D: "#f87171" };
  const RANK_VALUES = { A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };

  function freshDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, value: RANK_VALUES[rank] });
      }
    }
    return deck;
  }

  // Fisher-Yates shuffle
  function shuffle(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function newShuffledDeck() {
    return shuffle(freshDeck());
  }

  // -------------------------------------------------------------
  // CANVAS CARD DRAWING — draws a playing card at (x,y) with size (w,h)
  // -------------------------------------------------------------
  function drawCard(ctx, card, x, y, w, h, opts = {}) {
    const { faceDown = false, rotation = 0, glow = null } = opts;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation);
    ctx.translate(-w / 2, -h / 2);

    // Shadow / glow
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
    }

    // Card body
    const radius = 4;
    roundRect(ctx, 0, 0, w, h, radius);

    if (faceDown) {
      ctx.fillStyle = "#1c1f26";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(80,200,120,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Diagonal pattern
      ctx.save();
      roundRect(ctx, 0, 0, w, h, radius);
      ctx.clip();
      ctx.strokeStyle = "rgba(255,215,0,0.08)";
      ctx.lineWidth = 2;
      for (let i = -h; i < w; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#16181d";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,215,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const color = SUIT_COLORS[card.suit] || "#e5e7eb";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.floor(h * 0.22)}px sans-serif`;
      ctx.fillText(card.rank, w * 0.08, h * 0.06);
      ctx.font = `${Math.floor(h * 0.2)}px sans-serif`;
      ctx.fillText(SUIT_SYMBOLS[card.suit], w * 0.08, h * 0.30);

      // Center suit symbol (large)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.floor(h * 0.4)}px sans-serif`;
      ctx.fillText(SUIT_SYMBOLS[card.suit], w / 2, h / 2 + h * 0.05);
    }

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // -------------------------------------------------------------
  // TEEN PATTI HAND RANKING (3-card)
  // Returns { rank: number, name: string } — higher rank wins
  // 6 Trail (set) > 5 Pure Sequence > 4 Sequence > 3 Color (flush) > 2 Pair > 1 High Card
  // -------------------------------------------------------------
  function rankTeenPattiHand(cards) {
    const values = cards.map((c) => c.value).sort((a, b) => b - a);
    const suits = cards.map((c) => c.suit);
    const isFlush = suits.every((s) => s === suits[0]);

    // Sequence check (handle A-2-3 as well as A-K-Q via value remap)
    const sortedVals = [...values].sort((a, b) => a - b);
    let isSequence = sortedVals[1] === sortedVals[0] + 1 && sortedVals[2] === sortedVals[1] + 1;
    // A-2-3 special case (A=14, 2=2, 3=3 -> treat as 1,2,3)
    if (!isSequence && sortedVals[0] === 2 && sortedVals[1] === 3 && sortedVals[2] === 14) {
      isSequence = true;
    }

    const isTrail = values[0] === values[1] && values[1] === values[2];
    const pairCount = new Set(values).size;

    if (isTrail) return { rank: 6, name: "Trail (Set)", high: values[0] };
    if (isSequence && isFlush) return { rank: 5, name: "Pure Sequence", high: values[0] };
    if (isSequence) return { rank: 4, name: "Sequence (Run)", high: values[0] };
    if (isFlush) return { rank: 3, name: "Color (Flush)", high: values[0] };
    if (pairCount === 2) return { rank: 2, name: "Pair", high: values[0] };
    return { rank: 1, name: "High Card", high: values[0] };
  }

  /** Compares two Teen Patti hands. Returns 'A', 'B', or 'tie'. */
  function compareTeenPattiHands(handA, handB) {
    const rA = rankTeenPattiHand(handA);
    const rB = rankTeenPattiHand(handB);
    if (rA.rank !== rB.rank) return rA.rank > rB.rank ? "A" : "B";

    // Same rank category — compare card-by-card (sorted descending)
    const va = handA.map((c) => c.value).sort((a, b) => b - a);
    const vb = handB.map((c) => c.value).sort((a, b) => b - a);
    for (let i = 0; i < 3; i++) {
      if (va[i] !== vb[i]) return va[i] > vb[i] ? "A" : "B";
    }
    return "tie";
  }

  // -------------------------------------------------------------
  // BLACKJACK HAND VALUE — handles soft aces
  // -------------------------------------------------------------
  function blackjackValue(cards) {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
      if (c.rank === "A") {
        total += 11;
        aces++;
      } else if (["K", "Q", "J"].includes(c.rank)) {
        total += 10;
      } else {
        total += Number(c.rank);
      }
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  // -------------------------------------------------------------
  // BACCARAT HAND VALUE — sum mod 10 (face cards = 0, A = 1)
  // -------------------------------------------------------------
  function baccaratValue(cards) {
    let total = 0;
    for (const c of cards) {
      if (["K", "Q", "J", "10"].includes(c.rank)) total += 0;
      else if (c.rank === "A") total += 1;
      else total += Number(c.rank);
    }
    return total % 10;
  }

  window.CardUtils = {
    RANKS,
    SUITS,
    SUIT_SYMBOLS,
    SUIT_COLORS,
    RANK_VALUES,
    freshDeck,
    shuffle,
    newShuffledDeck,
    drawCard,
    roundRect,
    rankTeenPattiHand,
    compareTeenPattiHands,
    blackjackValue,
    baccaratValue
  };
})();
