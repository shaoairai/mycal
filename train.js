// ==================== 訓練（每週課表＋每週加量＋等級） ====================
// 獨立於行事曆的一頁。資料放在 users/{phone}/train/：
//   exercises/{id}: { name, unit, days, reps, sets, step, cap, since, order }
//       days 是字串，0=週一 … 6=週日，例如 "024"；since 之前的日子不算漏做
//   log/{YYYY-MM-DD}/{exId}: { name, unit, reps, sets, xp, late, ts }
//   weeks/{該週週一的日期}: { done, total, clear, xp, ups }   ← 過完的週才會寫
//   meta/week: 已結算到哪一週（週一的日期）
// 等級不另外存，一律從 log 與 weeks 的 xp 加總算出來，才不會兩邊對不起來。

import { getApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  remove,
  onValue,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// app.js 已經 initializeApp 過，這裡拿同一個
const db = getDatabase(getApp());

const XP_QUEST = 20; // 當天完成
const XP_LATE = 10; // 補課
const XP_WEEK = 50; // 整週達標

const RANKS = [
  [45, "S"],
  [30, "A"],
  [20, "B"],
  [10, "C"],
  [5, "D"],
  [1, "E"],
];

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];
const UNITS = ["下", "秒", "分鐘", "公里"];
const PRESETS = [
  { name: "伏地挺身", unit: "下" },
  { name: "深蹲", unit: "下" },
  { name: "仰臥起坐", unit: "下" },
  { name: "引體向上", unit: "下" },
  { name: "平板撐", unit: "秒" },
  { name: "跑步", unit: "公里" },
];

let user = null;
let data = {};
let loaded = false;
let unsubscribe = null;
let editingId = null;
let formDays = "";
// 只有自己剛按下完成時才放升級動畫，別台裝置同步過來的不放
let celebrateUntil = 0;
let lastLevel = null;
let lastWeekClear = null;
let toastTimer = null;

const page = document.getElementById("trainPage");
const body = document.getElementById("trainBody");
const navBtn = document.getElementById("trainNavBtn");
const backBtn = document.getElementById("trainBackBtn");
const planBtn = document.getElementById("trainPlanBtn");
const planSheet = document.getElementById("trainPlanSheet");
const planList = document.getElementById("trainPlanList");
const addBtn = document.getElementById("trainAddBtn");
const editSheet = document.getElementById("trainEditSheet");
const editTitle = document.getElementById("trainEditTitle");
const form = document.getElementById("trainForm");
const nameInput = document.getElementById("trainName");
const presetBox = document.getElementById("trainPresets");
const daysBox = document.getElementById("trainDays");
const repsInput = document.getElementById("trainReps");
const unitSelect = document.getElementById("trainUnit");
const setsInput = document.getElementById("trainSets");
const stepInput = document.getElementById("trainStep");
const capInput = document.getElementById("trainCap");
const formError = document.getElementById("trainFormError");
const deleteBtn = document.getElementById("trainDeleteBtn");
const levelUp = document.getElementById("trainLevelUp");
const toast = document.getElementById("trainToast");

// ==================== 日期工具 ====================

function iso(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseIso(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(s, n) {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

// 一週以週一為起點
function weekStart(s) {
  const d = parseIso(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
}

function todayIso() {
  return iso(new Date());
}

// ==================== 計算 ====================

function num(n) {
  return String(Math.round(n * 100) / 100);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function sortedExercises(d) {
  return Object.entries(d.exercises || {})
    .map(([id, ex]) => ({ id, ...ex }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

// 這個動作在某一週該做的日期
function scheduledDates(ex, wk) {
  const dates = [];
  for (const ch of String(ex.days || "")) {
    const date = addDays(wk, Number(ch));
    if (!ex.since || date >= ex.since) dates.push(date);
  }
  return dates.sort();
}

function isLogged(d, date, exId) {
  return Boolean(d.log && d.log[date] && d.log[date][exId]);
}

// 一週的完成狀況；perEx 給結算加量用
function weekSummary(d, wk) {
  let total = 0;
  let done = 0;
  const perEx = {};
  for (const ex of sortedExercises(d)) {
    const dates = scheduledDates(ex, wk);
    const exDone = dates.filter((date) => isLogged(d, date, ex.id)).length;
    perEx[ex.id] = { total: dates.length, done: exDone };
    total += dates.length;
    done += exDone;
  }
  return { total, done, clear: total > 0 && done === total, perEx };
}

function totalXp(d, wk) {
  let xp = 0;
  for (const day of Object.values(d.log || {})) {
    for (const entry of Object.values(day)) xp += entry.xp || 0;
  }
  for (const week of Object.values(d.weeks || {})) xp += week.xp || 0;
  // 本週還沒結算，達標的獎勵先算進來
  if (weekSummary(d, wk).clear) xp += XP_WEEK;
  return xp;
}

function levelInfo(xp) {
  let lv = 1;
  let need = 100;
  while (xp >= need) {
    xp -= need;
    lv += 1;
    need = 100 + 20 * (lv - 1);
  }
  const rank = RANKS.find(([min]) => lv >= min)[1];
  return { lv, cur: xp, need, rank };
}

// 連續達標幾週（本週已達標也算）
function streakWeeks(d, wk) {
  let n = weekSummary(d, wk).clear ? 1 : 0;
  let prev = addDays(wk, -7);
  while (d.weeks && d.weeks[prev] && d.weeks[prev].clear) {
    n += 1;
    prev = addDays(prev, -7);
  }
  return n;
}

function volumeOf(d, exId) {
  let sum = 0;
  for (const day of Object.values(d.log || {})) {
    const entry = day[exId];
    if (entry) sum += (entry.reps || 0) * (entry.sets || 1);
  }
  return sum;
}

function targetText(ex) {
  const base = `${num(ex.reps)} ${ex.unit}`;
  return ex.sets > 1 ? `${base} × ${ex.sets} 組` : base;
}

function atCap(ex) {
  return Boolean(ex.cap) && ex.reps >= ex.cap;
}

// ==================== 每週結算 ====================

// 新的一週第一次打開時，回頭看上一個結算週：
// 該週排的都做完 → 下週加量；沒做完 → 維持原量。
// 放在 transaction 裡，兩台裝置同時打開也只會加一次。
function rollover() {
  if (!user || !loaded) return;
  const cur = weekStart(todayIso());
  const metaWeek = data.meta && data.meta.week;
  if (!metaWeek || metaWeek >= cur) return;

  runTransaction(ref(db, `users/${user}/train`), (t) => {
    if (!t || !t.meta || !t.meta.week || t.meta.week >= cur) return t;
    const wk = t.meta.week;
    const summary = weekSummary(t, wk);
    const ups = {};
    for (const ex of sortedExercises(t)) {
      const s = summary.perEx[ex.id];
      const step = Number(ex.step) || 0;
      if (!s.total || s.done < s.total || step <= 0 || atCap(ex)) continue;
      let next = ex.reps + step;
      if (ex.cap) next = Math.min(next, ex.cap);
      next = Math.round(next * 100) / 100;
      ups[ex.id] = { name: ex.name, unit: ex.unit, from: ex.reps, to: next };
      t.exercises[ex.id].reps = next;
    }
    if (summary.total > 0) {
      t.weeks = t.weeks || {};
      t.weeks[wk] = {
        done: summary.done,
        total: summary.total,
        clear: summary.clear,
        xp: summary.clear ? XP_WEEK : 0,
        ups,
      };
    }
    t.meta.week = cur;
    return t;
  }).catch((error) => console.error("訓練週結算失敗:", error));
}

// ==================== 今日畫面 ====================

function questHtml(ex, date, today) {
  const done = isLogged(data, date, ex.id);
  const late = date < today;
  const dayName = DAY_NAMES[(parseIso(date).getDay() + 6) % 7];
  let hint = "";
  if (late) hint = `週${dayName}`;
  else if (atCap(ex)) hint = "已達上限";
  else if (ex.step > 0) hint = `達標 +${num(ex.step)}`;
  return `
    <button class="train-quest${done ? " is-done" : ""}" data-ex="${ex.id}" data-date="${date}">
      <span class="train-quest-main">
        <b>${escapeHtml(ex.name)}</b>
        <small>${targetText(ex)}${hint ? ` · ${hint}` : ""}</small>
      </span>
      <span class="train-check">${done ? "✓" : ""}</span>
    </button>`;
}

function render() {
  if (!user || page.classList.contains("hidden")) return;
  if (!loaded) {
    body.innerHTML = "";
    return;
  }

  const exercises = sortedExercises(data);
  if (!exercises.length) {
    body.innerHTML = `
      <div class="train-empty">
        <p>還沒有課表</p>
        <button class="train-primary" data-action="add">＋ 新增動作</button>
      </div>`;
    return;
  }

  const today = todayIso();
  const wk = weekStart(today);
  const summary = weekSummary(data, wk);
  const info = levelInfo(totalXp(data, wk));
  const streak = streakWeeks(data, wk);

  // 每天的格子
  const dayCells = DAY_NAMES.map((name, i) => {
    const date = addDays(wk, i);
    let total = 0;
    let done = 0;
    for (const ex of exercises) {
      if (!scheduledDates(ex, wk).includes(date)) continue;
      total += 1;
      if (isLogged(data, date, ex.id)) done += 1;
    }
    let state = "todo";
    let mark = `${done}/${total}`;
    if (!total) {
      state = "rest";
      mark = "·";
    } else if (done === total) {
      state = "done";
      mark = "✓";
    } else if (date < today) {
      state = "miss";
    }
    const isToday = date === today ? " is-today" : "";
    return `<div class="train-day is-${state}${isToday}"><span>${name}</span><b>${mark}</b></div>`;
  }).join("");

  // 上週結算結果
  let banner = "";
  const last = data.weeks && data.weeks[addDays(wk, -7)];
  if (last) {
    const ups = Object.values(last.ups || {});
    if (ups.length) {
      banner = `<div class="train-banner is-up">${ups
        .map(
          (u) =>
            `<span>⬆ ${escapeHtml(u.name)} ${num(u.from)} → ${num(u.to)} ${u.unit}</span>`
        )
        .join("")}</div>`;
    } else if (!last.clear) {
      banner = `<div class="train-banner">上週未達標，維持原量</div>`;
    }
  }

  const todayQuests = exercises.filter((ex) =>
    scheduledDates(ex, wk).includes(today)
  );
  const makeups = [];
  for (const ex of exercises) {
    for (const date of scheduledDates(ex, wk)) {
      if (date < today && !isLogged(data, date, ex.id)) makeups.push({ ex, date });
    }
  }
  makeups.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let todayHtml;
  if (todayQuests.length) {
    todayHtml = todayQuests.map((ex) => questHtml(ex, today, today)).join("");
  } else {
    let next = "";
    for (let i = 1; i <= 7 && !next; i++) {
      const date = addDays(today, i);
      const dayIndex = (parseIso(date).getDay() + 6) % 7;
      if (exercises.some((ex) => String(ex.days).includes(String(dayIndex)))) {
        next = `下次：週${DAY_NAMES[dayIndex]}`;
      }
    }
    todayHtml = `<div class="train-rest">今天休息${next ? `<small>${next}</small>` : ""}</div>`;
  }

  body.innerHTML = `
    <section class="train-hud">
      <div class="train-rank" data-rank="${info.rank}">${info.rank}</div>
      <div class="train-hud-main">
        <div class="train-hud-row">
          <span class="train-lv">Lv.${info.lv}</span>
          <span class="train-streak${streak ? " is-on" : ""}">🔥 ${streak} 週</span>
        </div>
        <div class="train-xpbar"><i style="width:${Math.round((info.cur / info.need) * 100)}%"></i></div>
        <div class="train-xptext">${info.cur} / ${info.need} XP</div>
      </div>
    </section>

    <section class="train-week">
      <div class="train-week-days">${dayCells}</div>
      <div class="train-week-total${summary.clear ? " is-clear" : ""}">
        本週 ${summary.done} / ${summary.total}${summary.clear ? " 達標" : ""}
      </div>
    </section>

    ${banner}

    <h3 class="train-h">今日任務</h3>
    <div class="train-quests">${todayHtml}</div>

    ${
      makeups.length
        ? `<h3 class="train-h">補課</h3>
           <div class="train-quests">${makeups
             .map(({ ex, date }) => questHtml(ex, date, today))
             .join("")}</div>`
        : ""
    }
  `;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 1800);
}

function showLevelUp(info, rankChanged) {
  levelUp.innerHTML = `
    <div class="train-levelup-box">
      <small>${rankChanged ? "RANK UP" : "LEVEL UP"}</small>
      <b>${rankChanged ? `${info.rank} 級` : `Lv.${info.lv}`}</b>
    </div>`;
  levelUp.classList.remove("hidden");
  setTimeout(() => levelUp.classList.add("hidden"), 1800);
}

async function toggleQuest(exId, date) {
  const ex = data.exercises && data.exercises[exId];
  if (!ex) return;
  const path = `users/${user}/train/log/${date}/${exId}`;
  try {
    if (isLogged(data, date, exId)) {
      if (!confirm("取消完成？")) return;
      await remove(ref(db, path));
      return;
    }
    const late = date < todayIso();
    const xp = late ? XP_LATE : XP_QUEST;
    celebrateUntil = Date.now() + 3000;
    showToast(`+${xp} XP`);
    await set(ref(db, path), {
      name: ex.name,
      unit: ex.unit,
      reps: ex.reps,
      sets: ex.sets,
      xp,
      late,
      ts: Date.now(),
    });
  } catch (error) {
    console.error("更新訓練紀錄失敗:", error);
    showToast("儲存失敗");
  }
}

// ==================== 課表 ====================

function renderPlan() {
  const exercises = sortedExercises(data);
  planList.innerHTML = exercises.length
    ? exercises
        .map((ex) => {
          const days = [...String(ex.days)]
            .sort()
            .map((ch) => DAY_NAMES[Number(ch)])
            .join("");
          const step = ex.step > 0 ? ` · 每週 +${num(ex.step)}` : "";
          const cap = ex.cap ? ` · 上限 ${num(ex.cap)}` : "";
          return `
            <button class="train-plan-item" data-id="${ex.id}">
              <b>${escapeHtml(ex.name)}</b>
              <small>${days} · ${targetText(ex)}${step}${cap}</small>
              <em>累計 ${num(volumeOf(data, ex.id))} ${ex.unit}</em>
            </button>`;
        })
        .join("")
    : `<p class="train-plan-empty">還沒有動作</p>`;
}

function openPlan() {
  renderPlan();
  planSheet.classList.remove("hidden");
}

function renderFormDays() {
  daysBox.innerHTML = DAY_NAMES.map(
    (name, i) =>
      `<button type="button" class="train-chip${
        formDays.includes(String(i)) ? " is-on" : ""
      }" data-day="${i}">${name}</button>`
  ).join("");
}

function openEdit(id) {
  editingId = id || null;
  const ex = id ? data.exercises[id] : null;
  editTitle.textContent = ex ? "編輯動作" : "新增動作";
  nameInput.value = ex ? ex.name : "";
  formDays = ex ? String(ex.days) : "024";
  repsInput.value = ex ? ex.reps : 10;
  unitSelect.value = ex ? ex.unit : "下";
  setsInput.value = ex ? ex.sets : 3;
  stepInput.value = ex ? ex.step : 2;
  capInput.value = ex && ex.cap ? ex.cap : "";
  formError.textContent = "";
  deleteBtn.classList.toggle("hidden", !ex);
  renderFormDays();
  editSheet.classList.remove("hidden");
}

function closeEdit() {
  editSheet.classList.add("hidden");
  editingId = null;
}

async function saveExercise() {
  const name = nameInput.value.trim();
  const reps = Number(repsInput.value);
  const sets = Math.round(Number(setsInput.value));
  const step = Number(stepInput.value) || 0;
  const cap = Number(capInput.value) || 0;

  if (!name) return (formError.textContent = "請輸入動作");
  if (!formDays) return (formError.textContent = "請選星期");
  if (!(reps > 0)) return (formError.textContent = "每組要大於 0");
  if (!(sets >= 1)) return (formError.textContent = "組數至少 1");
  if (step < 0) return (formError.textContent = "每週加不能是負數");
  if (cap && cap < reps) return (formError.textContent = "上限不能小於每組");

  const today = todayIso();
  const old = editingId ? data.exercises[editingId] : null;
  const id = editingId || `e${Date.now().toString(36)}`;
  const exercise = {
    name,
    unit: unitSelect.value,
    days: [...formDays].sort().join(""),
    reps,
    sets,
    step,
    cap,
    since: old ? old.since : today,
    order: old ? old.order : Date.now(),
  };

  try {
    await update(ref(db, `users/${user}/train`), {
      [`exercises/${id}`]: exercise,
      // 第一次建課表時從本週開始結算
      "meta/week": (data.meta && data.meta.week) || weekStart(today),
    });
    closeEdit();
  } catch (error) {
    console.error("儲存動作失敗:", error);
    formError.textContent = "儲存失敗";
  }
}

async function deleteExercise() {
  if (!editingId) return;
  if (!confirm("刪除這個動作？紀錄與經驗值會保留")) return;
  try {
    await remove(ref(db, `users/${user}/train/exercises/${editingId}`));
    closeEdit();
  } catch (error) {
    console.error("刪除動作失敗:", error);
    formError.textContent = "刪除失敗";
  }
}

// ==================== 切換與登入 ====================

function viewStorageKey() {
  return `mycalView:${user}`;
}

function setOpen(open) {
  page.classList.toggle("hidden", !open);
  try {
    localStorage.setItem(viewStorageKey(), open ? "train" : "cal");
  } catch (error) {
    // 存不了就算了，下次從行事曆開始
  }
  if (open) {
    rollover();
    render();
  }
}

function onData(snapshot) {
  data = snapshot.exists() ? snapshot.val() : {};
  loaded = true;

  const wk = weekStart(todayIso());
  const info = levelInfo(totalXp(data, wk));
  const clear = weekSummary(data, wk).clear;
  if (Date.now() < celebrateUntil) {
    if (lastLevel && info.lv > lastLevel.lv) {
      showLevelUp(info, info.rank !== lastLevel.rank);
    } else if (lastWeekClear === false && clear) {
      showToast(`本週達標 +${XP_WEEK} XP`);
    }
  }
  lastLevel = info;
  lastWeekClear = clear;

  rollover();
  render();
  if (!planSheet.classList.contains("hidden")) renderPlan();
}

function start() {
  const phone = window.mycalUser;
  if (!phone || phone === user) return;
  stop();
  user = phone;
  unsubscribe = onValue(ref(db, `users/${user}/train`), onData);

  let saved = null;
  try {
    saved = localStorage.getItem(viewStorageKey());
  } catch (error) {
    saved = null;
  }
  page.classList.toggle("hidden", saved !== "train");
  render();
}

function stop() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  user = null;
  data = {};
  loaded = false;
  lastLevel = null;
  lastWeekClear = null;
  page.classList.add("hidden");
  planSheet.classList.add("hidden");
  editSheet.classList.add("hidden");
}

// ==================== 事件 ====================

navBtn.addEventListener("click", () => setOpen(true));
backBtn.addEventListener("click", () => setOpen(false));
planBtn.addEventListener("click", openPlan);
addBtn.addEventListener("click", () => openEdit(null));
deleteBtn.addEventListener("click", deleteExercise);

body.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="add"]')) return openEdit(null);
  const quest = e.target.closest(".train-quest");
  if (quest) toggleQuest(quest.dataset.ex, quest.dataset.date);
});

planList.addEventListener("click", (e) => {
  const item = e.target.closest(".train-plan-item");
  if (item) openEdit(item.dataset.id);
});

page.addEventListener("click", (e) => {
  const close = e.target.closest("[data-close]");
  if (!close) return;
  if (close.dataset.close === "edit") closeEdit();
  else planSheet.classList.add("hidden");
});

presetBox.innerHTML = PRESETS.map(
  (p) =>
    `<button type="button" class="train-chip" data-name="${p.name}" data-unit="${p.unit}">${p.name}</button>`
).join("");
presetBox.addEventListener("click", (e) => {
  const chip = e.target.closest(".train-chip");
  if (!chip) return;
  nameInput.value = chip.dataset.name;
  unitSelect.value = chip.dataset.unit;
});

unitSelect.innerHTML = UNITS.map((u) => `<option value="${u}">${u}</option>`).join("");

daysBox.addEventListener("click", (e) => {
  const chip = e.target.closest(".train-chip");
  if (!chip) return;
  const day = chip.dataset.day;
  formDays = formDays.includes(day) ? formDays.replace(day, "") : formDays + day;
  renderFormDays();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  saveExercise();
});

// 開著過夜或從背景回來：日期可能已經換了
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  rollover();
  render();
});

window.addEventListener("mycal:login", start);
window.addEventListener("mycal:logout", stop);
start();
