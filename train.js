// ==================== 訓練（每週課表＋每週加量） ====================
// 獨立於行事曆的一頁。資料放在 users/{phone}/train/：
//   exercises/{id}: { icon, name, unit, days, reps, sets, step, cap, since, order }
//       days 是字串，0=週一 … 6=週日，例如 "024"；since 之前的日子不算漏做
//   log/{YYYY-MM-DD}/{exId}: { name, unit, reps, sets, late, ts }
//   weeks/{該週週一的日期}: { done, total, clear, ups }   ← 過完的週才會寫
//   meta/week: 已結算到哪一週（週一的日期）

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

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];
const UNITS = ["下", "秒", "分鐘", "公里"];
const DEFAULT_ICON = "💪";
// 點圖示會順便帶入名稱、單位與起始的量
const PRESETS = [
  { icon: "💪", name: "伏地挺身", unit: "下", reps: 10, sets: 3, step: 2 },
  { icon: "🦵", name: "深蹲", unit: "下", reps: 15, sets: 3, step: 2 },
  { icon: "🤸", name: "仰臥起坐", unit: "下", reps: 15, sets: 3, step: 2 },
  { icon: "🧗", name: "引體向上", unit: "下", reps: 3, sets: 3, step: 1 },
  { icon: "🧘", name: "平板撐", unit: "秒", reps: 30, sets: 3, step: 5 },
  { icon: "🏃", name: "跑步", unit: "公里", reps: 2, sets: 1, step: 0.5 },
];
const ICONS = [...PRESETS.map((p) => p.icon), "🚴", "🏊", "🏋️", "🚶", "🥊", "⚡"];

let user = null;
let data = {};
let loaded = false;
let unsubscribe = null;
let editingId = null;
let formDays = "";
let formIcon = DEFAULT_ICON;
// 只有自己剛按下完成時才慶祝，別台裝置同步過來的不算
let celebrateUntil = 0;
let lastWeekClear = null;
let toastTimer = null;

const page = document.getElementById("trainPage");
const title = document.getElementById("trainTitle");
const body = document.getElementById("trainBody");
const navBtn = document.getElementById("trainNavBtn");
const backBtn = document.getElementById("trainBackBtn");
const addBtn = document.getElementById("trainAddBtn");
const editSheet = document.getElementById("trainEditSheet");
const closeBtn = document.getElementById("trainCloseBtn");
const form = document.getElementById("trainForm");
const iconBox = document.getElementById("trainIcons");
const nameInput = document.getElementById("trainName");
const daysBox = document.getElementById("trainDays");
const repsInput = document.getElementById("trainReps");
const unitSelect = document.getElementById("trainUnit");
const setsInput = document.getElementById("trainSets");
const stepInput = document.getElementById("trainStep");
const capInput = document.getElementById("trainCap");
const formError = document.getElementById("trainFormError");
const deleteBtn = document.getElementById("trainDeleteBtn");
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

function shortDate(s) {
  const d = parseIso(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ==================== 計算 ====================

function round2(n) {
  return Math.round(n * 100) / 100;
}

function num(n) {
  return String(round2(n));
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

// 連續完成幾週（本週已完成也算）
function streakWeeks(d, wk) {
  let n = weekSummary(d, wk).clear ? 1 : 0;
  let prev = addDays(wk, -7);
  while (d.weeks && d.weeks[prev] && d.weeks[prev].clear) {
    n += 1;
    prev = addDays(prev, -7);
  }
  return n;
}

function atCap(ex) {
  return Boolean(ex.cap) && ex.reps >= ex.cap;
}

// 整週做完的話下週的量；不會再加就回 null
function nextReps(ex) {
  const step = Number(ex.step) || 0;
  if (step <= 0 || atCap(ex)) return null;
  let next = ex.reps + step;
  if (ex.cap) next = Math.min(next, ex.cap);
  return round2(next);
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
      const next = nextReps(ex);
      if (!s.total || s.done < s.total || next === null) continue;
      ups[ex.id] = {
        icon: ex.icon || DEFAULT_ICON,
        name: ex.name,
        unit: ex.unit,
        from: ex.reps,
        to: next,
      };
      t.exercises[ex.id].reps = next;
    }
    if (summary.total > 0) {
      t.weeks = t.weeks || {};
      t.weeks[wk] = {
        done: summary.done,
        total: summary.total,
        clear: summary.clear,
        ups,
      };
    }
    t.meta.week = cur;
    return t;
  }).catch((error) => console.error("訓練週結算失敗:", error));
}

// ==================== 本週畫面 ====================

function cardHtml(ex, wk, today) {
  const dates = scheduledDates(ex, wk);
  const isToday = dates.includes(today);
  const doneToday = isToday && isLogged(data, today, ex.id);
  const allDone =
    dates.length > 0 && dates.every((date) => isLogged(data, date, ex.id));
  const hasMiss = dates.some(
    (date) => date < today && !isLogged(data, date, ex.id)
  );

  const pills = dates
    .map((date) => {
      let state = "todo";
      if (isLogged(data, date, ex.id)) state = "done";
      else if (date < today) state = "miss";
      else if (date === today) state = "today";
      const name = DAY_NAMES[(parseIso(date).getDay() + 6) % 7];
      return `<button class="train-pill is-${state}" data-ex="${ex.id}" data-date="${date}"${
        state === "todo" ? " disabled" : ""
      }>${name}</button>`;
    })
    .join("");

  const next = nextReps(ex);
  let nextHtml = "";
  if (next !== null) {
    nextHtml = `<span class="train-next${allDone ? " is-on" : ""}">⬆ ${num(next)}</span>`;
  } else if (atCap(ex)) {
    nextHtml = `<span class="train-next is-on">🏁</span>`;
  }

  let state = "is-rest";
  if (doneToday) state = "is-done";
  else if (isToday) state = "is-today";
  else if (hasMiss) state = "is-miss";

  return `
    <article class="train-card ${state}">
      <button class="train-card-main" data-edit="${ex.id}">
        <span class="train-ico">${escapeHtml(ex.icon || DEFAULT_ICON)}</span>
        <span class="train-card-text">
          <small>${escapeHtml(ex.name)}</small>
          <b>${num(ex.reps)}<i>${ex.unit}</i>${ex.sets > 1 ? `× ${ex.sets}` : ""}</b>
        </span>
      </button>
      ${
        isToday
          ? `<button class="train-check" data-ex="${ex.id}" data-date="${today}">${
              doneToday ? "✓" : ""
            }</button>`
          : ""
      }
      <div class="train-card-foot">
        <div class="train-pills">${pills}</div>
        ${nextHtml}
      </div>
    </article>`;
}

function render() {
  if (!user || page.classList.contains("hidden")) return;
  const today = todayIso();
  const wk = weekStart(today);
  title.textContent = `${shortDate(wk)} – ${shortDate(addDays(wk, 6))}`;
  if (!loaded) {
    body.innerHTML = "";
    return;
  }

  const exercises = sortedExercises(data);
  if (!exercises.length) {
    body.innerHTML = `
      <div class="train-empty">
        <span>🏋️</span>
        <button data-action="add" title="新增">＋</button>
      </div>`;
    return;
  }

  const summary = weekSummary(data, wk);
  const streak = streakWeeks(data, wk);
  const percent = summary.total
    ? Math.round((summary.done / summary.total) * 100)
    : 0;

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
    if (!total) state = "rest";
    else if (done === total) state = "done";
    else if (date < today) state = "miss";
    const isToday = date === today ? " is-today" : "";
    const fill = total ? Math.round((done / total) * 100) : 0;
    return `<div class="train-day is-${state}${isToday}"><span>${name}</span><i class="train-dot" style="--p:${fill}">${
      state === "done" ? "✓" : ""
    }</i></div>`;
  }).join("");

  // 上週結算結果
  let banner = "";
  const last = data.weeks && data.weeks[addDays(wk, -7)];
  if (last) {
    const chips = Object.values(last.ups || {}).map(
      (u) =>
        `<span class="is-up">${escapeHtml(u.icon || "⬆")} ${num(u.from)} → ${num(u.to)}</span>`
    );
    if (!last.clear) chips.push(`<span>上週 ${last.done}/${last.total}</span>`);
    if (chips.length) banner = `<div class="train-banner">${chips.join("")}</div>`;
  }

  // 今天要做的排前面
  const isToday = (ex) => scheduledDates(ex, wk).includes(today);
  const ordered = [
    ...exercises.filter(isToday),
    ...exercises.filter((ex) => !isToday(ex)),
  ];

  body.innerHTML = `
    <section class="train-week">
      <div class="train-ring${summary.clear ? " is-clear" : ""}" style="--p:${percent}">
        <span>${summary.done}<small>/${summary.total}</small></span>
      </div>
      <div class="train-week-side">
        <div class="train-week-days">${dayCells}</div>
        <div class="train-streak${streak ? " is-on" : ""}">🔥 ${streak}</div>
      </div>
    </section>
    ${banner}
    ${exercises.some(isToday) ? "" : `<div class="train-rest">😴</div>`}
    <div class="train-cards">${ordered
      .map((ex) => cardHtml(ex, wk, today))
      .join("")}</div>
  `;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 1800);
}

async function toggleDone(exId, date) {
  const ex = data.exercises && data.exercises[exId];
  if (!ex) return;
  const path = `users/${user}/train/log/${date}/${exId}`;
  try {
    if (isLogged(data, date, exId)) {
      if (!confirm("取消完成？")) return;
      await remove(ref(db, path));
      return;
    }
    celebrateUntil = Date.now() + 3000;
    await set(ref(db, path), {
      name: ex.name,
      unit: ex.unit,
      reps: ex.reps,
      sets: ex.sets,
      late: date < todayIso(),
      ts: Date.now(),
    });
  } catch (error) {
    console.error("更新訓練紀錄失敗:", error);
    showToast("儲存失敗");
  }
}

// ==================== 新增／編輯動作 ====================

function renderFormIcons() {
  iconBox.innerHTML = ICONS.map(
    (icon) =>
      `<button type="button" class="train-chip${
        icon === formIcon ? " is-on" : ""
      }" data-icon="${icon}">${icon}</button>`
  ).join("");
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
  formIcon = ex ? ex.icon || DEFAULT_ICON : DEFAULT_ICON;
  nameInput.value = ex ? ex.name : "";
  formDays = ex ? String(ex.days) : "024";
  repsInput.value = ex ? ex.reps : 10;
  unitSelect.value = ex ? ex.unit : "下";
  setsInput.value = ex ? ex.sets : 3;
  stepInput.value = ex ? ex.step : 2;
  capInput.value = ex && ex.cap ? ex.cap : "";
  formError.textContent = "";
  deleteBtn.classList.toggle("is-off", !ex);
  renderFormIcons();
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

  if (!name) return (formError.textContent = "請輸入名稱");
  if (!formDays) return (formError.textContent = "請選星期");
  if (!(reps > 0)) return (formError.textContent = "每組要大於 0");
  if (!(sets >= 1)) return (formError.textContent = "組數至少 1");
  if (step < 0) return (formError.textContent = "每週加不能是負數");
  if (cap && cap < reps) return (formError.textContent = "上限不能小於每組");

  const today = todayIso();
  const old = editingId ? data.exercises[editingId] : null;
  const id = editingId || `e${Date.now().toString(36)}`;
  const exercise = {
    icon: formIcon,
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
  if (!confirm("刪除？")) return;
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

  const clear = weekSummary(data, weekStart(todayIso())).clear;
  if (Date.now() < celebrateUntil && lastWeekClear === false && clear) {
    showToast("🎉 本週完成");
  }
  lastWeekClear = clear;

  rollover();
  render();
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
  lastWeekClear = null;
  page.classList.add("hidden");
  editSheet.classList.add("hidden");
}

// ==================== 事件 ====================

navBtn.addEventListener("click", () => setOpen(true));
backBtn.addEventListener("click", () => setOpen(false));
addBtn.addEventListener("click", () => openEdit(null));
closeBtn.addEventListener("click", closeEdit);
deleteBtn.addEventListener("click", deleteExercise);

body.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="add"]')) return openEdit(null);
  const mark = e.target.closest("[data-date]");
  if (mark) return toggleDone(mark.dataset.ex, mark.dataset.date);
  const main = e.target.closest("[data-edit]");
  if (main) openEdit(main.dataset.edit);
});

iconBox.addEventListener("click", (e) => {
  const chip = e.target.closest(".train-chip");
  if (!chip) return;
  formIcon = chip.dataset.icon;
  // 名稱還沒自己打過，就跟著圖示換
  const preset = PRESETS.find((p) => p.icon === formIcon);
  const name = nameInput.value.trim();
  if (preset && (!name || PRESETS.some((p) => p.name === name))) {
    nameInput.value = preset.name;
    unitSelect.value = preset.unit;
    // 已經在練的動作不動它的量
    if (!editingId) {
      repsInput.value = preset.reps;
      setsInput.value = preset.sets;
      stepInput.value = preset.step;
    }
  }
  renderFormIcons();
});

unitSelect.innerHTML = UNITS.map((u) => `<option value="${u}">${u}</option>`).join("");

daysBox.addEventListener("click", (e) => {
  const chip = e.target.closest(".train-chip");
  if (!chip) return;
  const day = chip.dataset.day;
  formDays = formDays.includes(day) ? formDays.replace(day, "") : formDays + day;
  renderFormDays();
});

form.addEventListener("input", () => (formError.textContent = ""));

// − ＋ 按鈕
form.addEventListener("click", (e) => {
  formError.textContent = "";
  const btn = e.target.closest("[data-step]");
  if (!btn) return;
  const input = btn.parentElement.querySelector("input");
  const min = Number(input.min) || 0;
  const value = (Number(input.value) || 0) + Number(btn.dataset.step);
  input.value = num(Math.max(min, value));
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
