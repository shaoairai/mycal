// Firebase SDK 導入
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyDYqveRLIRReHX3z-Gyg_hOI59Q_0SULJE",
  authDomain: "my2026-e8f99.firebaseapp.com",
  databaseURL:
    "https://my2026-e8f99-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my2026-e8f99",
  storageBucket: "my2026-e8f99.firebasestorage.app",
  messagingSenderId: "824810826104",
  appId: "1:824810826104:web:52c5ee818a1ac75d15c08d",
  measurementId: "G-K60ELT05VH",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 預設白名單（若 Firebase 中不存在則自動建立）
const DEFAULT_WHITELIST = {
  "0935033983": { password: "a123321a" },
  "0963531832": { password: "a123321a" },
};

// 全域變數
let currentUser = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let dailyGoalsData = {};
let selectedDate = null;

// DOM 元素
const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const phoneInput = document.getElementById("phoneInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserDisplay = document.getElementById("currentUserDisplay");
const changePasswordBtn = document.getElementById("changePasswordBtn");

const monthGoalInput = document.getElementById("monthGoalInput");
const addMonthGoalBtn = document.getElementById("addMonthGoalBtn");
const monthGoalsList = document.getElementById("monthGoalsList");


const progressRate = document.getElementById("progressRate");
const progressDetail = document.getElementById("progressDetail");
const progressNavBtn = document.getElementById("progressNavBtn");
const progressModal = document.getElementById("progressModal");
const closeProgressModal = document.getElementById("closeProgressModal");
const progressTitle = document.getElementById("progressTitle");
const progressRateBig = document.getElementById("progressRateBig");
const progressThemeList = document.getElementById("progressThemeList");

// 最近一次 calculateProgressRate() 的結果
let currentProgress = null;

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const todayBtn = document.getElementById("todayBtn");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");

const appBody = document.querySelector(".app-body");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const progressBarFill = document.getElementById("progressBarFill");
const yearGoalsPanelTitle = document.getElementById("yearGoalsPanelTitle");

const weekPanel = document.getElementById("weekPanel");
const weekPanelBody = document.getElementById("weekPanelBody");
const weekPanelBtn = document.getElementById("weekPanelBtn");
const closeWeekPanelBtn = document.getElementById("closeWeekPanelBtn");
const weekGoalModal = document.getElementById("weekGoalModal");
const closeWeekGoalModal = document.getElementById("closeWeekGoalModal");
const weekGoalModalTitle = document.getElementById("weekGoalModalTitle");
const weekGoalModalRange = document.getElementById("weekGoalModalRange");
const weekGoalInput = document.getElementById("weekGoalInput");
const weekGoalColorPicker = document.getElementById("weekGoalColorPicker");
const saveWeekGoalBtn = document.getElementById("saveWeekGoalBtn");

const dailyModal = document.getElementById("dailyModal");
const closeModal = document.getElementById("closeModal");
const modalDate = document.getElementById("modalDate");
const itemsList = document.getElementById("itemsList");
const newItemInput = document.getElementById("newItemInput");
const addItemBtn = document.getElementById("addItemBtn");

const editItemModal = document.getElementById("editItemModal");
const closeEditModal = document.getElementById("closeEditModal");
const editItemInput = document.getElementById("editItemInput");
const saveEditBtn = document.getElementById("saveEditBtn");
const saveAndApplyEditBtn = document.getElementById("saveAndApplyEditBtn");

const newItemColorPicker = document.getElementById("newItemColorPicker");
const editItemColorPicker = document.getElementById("editItemColorPicker");

const yearGoalInput = document.getElementById("yearGoalInput");
const addYearGoalBtn = document.getElementById("addYearGoalBtn");
const yearGoalsList = document.getElementById("yearGoalsList");
const yearGoalColorPicker = document.getElementById("yearGoalColorPicker");

const monthGoalTitle = document.getElementById("monthGoalTitle");
const monthGoalColorPicker = document.getElementById("monthGoalColorPicker");

const editMonthGoalModal = document.getElementById("editMonthGoalModal");
const closeEditMonthGoalModal = document.getElementById(
  "closeEditMonthGoalModal"
);
const editMonthGoalInput = document.getElementById("editMonthGoalInput");
const editMonthGoalColorPicker = document.getElementById(
  "editMonthGoalColorPicker"
);
const saveEditMonthGoalBtn = document.getElementById("saveEditMonthGoalBtn");

const editYearGoalModal = document.getElementById("editYearGoalModal");
const closeEditYearGoalModal = document.getElementById(
  "closeEditYearGoalModal"
);
const editYearGoalInput = document.getElementById("editYearGoalInput");
const editYearGoalColorPicker = document.getElementById(
  "editYearGoalColorPicker"
);
const saveEditYearGoalBtn = document.getElementById("saveEditYearGoalBtn");

const passwordModal = document.getElementById("passwordModal");
const closePasswordModal = document.getElementById("closePasswordModal");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const passwordError = document.getElementById("passwordError");
const savePasswordBtn = document.getElementById("savePasswordBtn");

// 編輯中的項目資訊
let editingItemId = null;
let editingItemOriginalText = null;
let editingItemOriginalColor = null;

// 編輯中的年度目標資訊
let editingYearGoalId = null;
let selectedEditYearGoalColor = "blue";

// 編輯中的月目標資訊
let editingMonthGoalId = null;
let selectedEditMonthGoalColor = "blue";
let selectedMonthGoalColor = "blue";

// 拖曳中的項目資訊
let draggedItem = null;
let draggedYearGoal = null;
let draggedMonthGoal = null;

// 目前選擇的顏色
let selectedNewItemColor = "blue";
let selectedEditItemColor = "blue";
let selectedYearGoalColor = "blue";

// ==================== 顏色主題 ====================

// 8 種顏色的定義（色碼需與 style.css 的 .item-color-* 一致）
const COLOR_DEFS = [
  { key: "blue", hex: "#3498DB", label: "藍色" },
  { key: "red", hex: "#E74C3C", label: "紅色" },
  { key: "orange", hex: "#E67E22", label: "橘色" },
  { key: "yellow", hex: "#F1C40F", label: "黃色" },
  { key: "cyan", hex: "#1ABC9C", label: "青色" },
  { key: "purple", hex: "#9B59B6", label: "紫色" },
  { key: "pink", hex: "#E91E63", label: "粉色" },
  { key: "gray", hex: "#7F8C8D", label: "灰色" },
];

// 達成率的計算範圍：每個顏色主題可以各自挑要算哪些日子
const SCHEDULE_DEFS = [
  { key: "daily", label: "每日" },
  { key: "weekday", label: "平日" },
  { key: "weekend", label: "假日" },
  { key: "off", label: "不計" },
];
const DEFAULT_SCHEDULE = "daily";

const colorThemeList = document.getElementById("colorThemeList");

// 使用者自訂的顏色主題名稱 { blue: "運動", ... }
let colorThemeNames = {};

// 各顏色的計算範圍 { blue: "weekday", ... }，未設定即 DEFAULT_SCHEDULE
let colorSchedules = {};

// 各顏色的起始日期 { blue: "2026-03-15", ... }，起始日之前的日子不列入計算
let colorStartDates = {};

// 目前隱藏的顏色（僅影響日曆顯示，存在本機）
let hiddenColors = new Set();

function getColorLabel(key) {
  const def = COLOR_DEFS.find((c) => c.key === key);
  return colorThemeNames[key] || def?.label || key;
}

function getColorSchedule(schedules, key) {
  const value = schedules?.[key];
  return SCHEDULE_DEFS.some((s) => s.key === value) ? value : DEFAULT_SCHEDULE;
}

// 這一天要不要算進該主題的分母
function scheduleCoversDay(schedule, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (schedule === "weekday") return !isWeekend;
  if (schedule === "weekend") return isWeekend;
  return schedule === "daily";
}

// 起始日存成 "YYYY-MM-DD"，格式不對就當作沒設定
function getColorStartDate(starts, key) {
  const value = starts?.[key];
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : "";
}

// 產生所有顏色選擇器的色票（必須在下方的點擊監聽註冊之前執行）
function buildColorPickers() {
  const pickers = [
    newItemColorPicker,
    editItemColorPicker,
    yearGoalColorPicker,
    monthGoalColorPicker,
    editMonthGoalColorPicker,
    editYearGoalColorPicker,
    weekGoalColorPicker,
  ];

  pickers.forEach((picker) => {
    if (!picker) return;
    picker.innerHTML = "";
    COLOR_DEFS.forEach(({ key, hex, label }) => {
      const option = document.createElement("span");
      option.className = `color-option${key === "blue" ? " selected" : ""}`;
      option.dataset.color = key;
      option.style.background = hex;
      option.title = label;
      picker.appendChild(option);
    });
  });
}

buildColorPickers();

// 主題名稱改變時同步更新色票的 tooltip
function refreshColorPickerLabels() {
  document.querySelectorAll(".color-option[data-color]").forEach((option) => {
    option.title = getColorLabel(option.dataset.color);
  });
}

function hiddenColorsStorageKey() {
  return `mycal_hiddenColors_${currentUser}`;
}

function loadHiddenColors() {
  hiddenColors = new Set();
  try {
    const saved = localStorage.getItem(hiddenColorsStorageKey());
    if (saved) hiddenColors = new Set(JSON.parse(saved));
  } catch (error) {
    console.error("讀取顏色篩選失敗:", error);
  }
}

function saveHiddenColors() {
  try {
    localStorage.setItem(
      hiddenColorsStorageKey(),
      JSON.stringify([...hiddenColors])
    );
  } catch (error) {
    console.error("儲存顏色篩選失敗:", error);
  }
}

function renderColorThemes() {
  colorThemeList.innerHTML = "";

  COLOR_DEFS.forEach(({ key, hex }) => {
    const row = document.createElement("div");
    row.className = "color-theme-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "color-theme-check";
    checkbox.checked = !hiddenColors.has(key);
    checkbox.style.accentColor = hex;
    checkbox.title = "顯示／隱藏此顏色";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        hiddenColors.delete(key);
      } else {
        hiddenColors.add(key);
      }
      saveHiddenColors();
      row.classList.toggle("off", !checkbox.checked);
      updateCalendarStatus();
      renderWeekGoals();
    });

    const dot = document.createElement("span");
    dot.className = "color-theme-dot";
    dot.style.background = hex;

    const name = document.createElement("span");
    name.className = "color-theme-name";
    name.textContent = getColorLabel(key);
    name.title = "點擊命名主題";
    name.addEventListener("click", () => startRenameColorTheme(key, name));

    row.append(checkbox, dot, name);
    if (!checkbox.checked) row.classList.add("off");
    colorThemeList.appendChild(row);
  });
}

// 就地編輯主題名稱
function startRenameColorTheme(key, nameEl) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "color-theme-input";
  input.value = getColorLabel(key);
  input.maxLength = 12;

  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    const text = input.value.trim();
    input.replaceWith(nameEl);
    if (save) saveColorTheme(key, text);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));

  nameEl.replaceWith(input);
  input.focus();
  input.select();
}

async function saveColorTheme(key, text) {
  if (!currentUser) return;

  const def = COLOR_DEFS.find((c) => c.key === key);
  // 與預設名稱相同（或清空）就不存，維持預設
  const value = !text || text === def.label ? null : text;

  try {
    await set(ref(db, `users/${currentUser}/colorThemes/${key}`), value);
  } catch (error) {
    console.error("儲存顏色主題失敗:", error);
    alert("儲存失敗，請稍後再試");
  }
}

async function saveColorSchedule(key, schedule) {
  // 先更新本地再存，達成率不用等 Firebase 回來才重算
  colorSchedules[key] = schedule;
  calculateProgressRate();

  if (!currentUser) return;

  try {
    await set(
      ref(db, `users/${currentUser}/colorSchedules/${key}`),
      schedule === DEFAULT_SCHEDULE ? null : schedule
    );
  } catch (error) {
    console.error("儲存計算範圍失敗:", error);
    alert("儲存失敗，請稍後再試");
  }
}

async function saveColorStartDate(key, dateStr) {
  const value = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : "";
  colorStartDates[key] = value;
  calculateProgressRate();

  if (!currentUser) return;

  try {
    await set(
      ref(db, `users/${currentUser}/colorStartDates/${key}`),
      value || null
    );
  } catch (error) {
    console.error("儲存起始日期失敗:", error);
    alert("儲存失敗，請稍後再試");
  }
}

// ==================== 觸控拖曳橋接 ====================

// 手機沒有 HTML5 的 drag 事件，這裡用「長按 + 滑動」合成同一組事件，
// 讓既有的 dragstart / dragover / drop 邏輯不用改就能在觸控上運作。
const TOUCH_HOLD_MS = 220;
const TOUCH_SLOP_PX = 10;

function initTouchDragBridge() {
  let source = null;
  let lastTarget = null;
  let holdTimer = null;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let transfer = null;

  function fire(el, type, x, y) {
    if (!el) return;
    el.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
        clientX: x,
        clientY: y,
      })
    );
  }

  function reset() {
    clearTimeout(holdTimer);
    source = null;
    lastTarget = null;
    dragging = false;
    transfer = null;
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;

      const el = e.target.closest?.('[draggable="true"]');
      if (!el) return;

      source = el;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;

      holdTimer = setTimeout(() => {
        if (!source) return;
        dragging = true;
        transfer = new DataTransfer();
        fire(source, "dragstart", startX, startY);
        navigator.vibrate?.(15);
      }, TOUCH_HOLD_MS);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!source) return;
      const touch = e.touches[0];

      // 長按成立前就移動 = 想捲動，放棄這次拖曳
      if (!dragging) {
        if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > TOUCH_SLOP_PX) {
          reset();
        }
        return;
      }

      // 拖曳中不要讓頁面跟著捲
      e.preventDefault();

      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      if (under !== lastTarget) {
        fire(lastTarget, "dragleave", touch.clientX, touch.clientY);
        lastTarget = under;
      }
      fire(under, "dragover", touch.clientX, touch.clientY);
    },
    { passive: false }
  );

  function finish(e) {
    if (!source) return;

    if (dragging) {
      const touch = e.changedTouches[0];
      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      fire(under, "drop", touch.clientX, touch.clientY);
      fire(source, "dragend", touch.clientX, touch.clientY);
    }

    reset();
  }

  document.addEventListener("touchend", finish);
  document.addEventListener("touchcancel", finish);
}

initTouchDragBridge();

// ==================== 側邊欄 ====================

// 窄畫面兩側都是浮動抽屜，同時開會疊在一起，所以互斥
function isNarrowLayout() {
  return window.innerWidth <= 900;
}

function setSidebarOpen(open) {
  appBody.classList.toggle("sidebar-hidden", !open);
  if (open && isNarrowLayout()) applyWeekPanelState(false);
}

sidebarToggle.addEventListener("click", () => {
  setSidebarOpen(appBody.classList.contains("sidebar-hidden"));
});

sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

// 窄畫面預設收合側邊欄
setSidebarOpen(window.innerWidth > 900);

// ==================== 導覽列下拉面板 ====================

const navDropdowns = [
  ["yearGoalsNavBtn", "yearGoalsPanel"],
  ["moreNavBtn", "moreMenu"],
].map(([btnId, panelId]) => ({
  btn: document.getElementById(btnId),
  panel: document.getElementById(panelId),
}));

function closeNavPanels() {
  navDropdowns.forEach(({ btn, panel }) => {
    panel.classList.add("hidden");
    btn.classList.remove("active");
  });
}

navDropdowns.forEach(({ btn, panel }) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = !panel.classList.contains("hidden");
    closeNavPanels();
    if (!wasOpen) {
      panel.classList.remove("hidden");
      btn.classList.add("active");
    }
  });

  // 點面板內部不關閉，但選單項目按下後要收起
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.classList.contains("nav-menu") && e.target.tagName === "BUTTON") {
      closeNavPanels();
    }
  });
});

document.addEventListener("click", closeNavPanels);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeNavPanels();
});

// ==================== 初始化白名單 ====================

async function initWhitelist() {
  try {
    const whitelistRef = ref(db, "loginWhitelist");
    const snapshot = await get(whitelistRef);

    if (!snapshot.exists()) {
      // 白名單不存在，建立預設白名單
      console.log("白名單不存在，正在建立預設白名單...");
      await set(whitelistRef, DEFAULT_WHITELIST);
      console.log("預設白名單已建立");
    }
  } catch (error) {
    console.error("初始化白名單失敗:", error);
  }
}

// ==================== 登入邏輯 ====================

// 檢查是否已登入
function checkLogin() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    showMainPage();
  }
}

// 登入按鈕事件
loginBtn.addEventListener("click", async () => {
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  loginError.textContent = "";

  if (!phone || !password) {
    loginError.textContent = "請輸入手機號碼和密碼";
    return;
  }

  try {
    // 從 Firebase 讀取該使用者的資料
    const userRef = ref(db, `loginWhitelist/${phone}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      // 檢查密碼是否正確
      if (userData.password === password) {
        // 登入成功
        currentUser = phone;
        localStorage.setItem("currentUser", phone);
        showMainPage();
      } else {
        loginError.textContent = "密碼錯誤";
      }
    } else {
      loginError.textContent = "此手機號碼不在白名單中";
    }
  } catch (error) {
    console.error("登入錯誤:", error);
    loginError.textContent = "登入發生錯誤，請稍後再試";
  }
});

// Enter 鍵登入
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    loginBtn.click();
  }
});

// 登出
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  loginPage.classList.remove("hidden");
  mainPage.classList.add("hidden");
  phoneInput.value = "";
  passwordInput.value = "";
});

// 顯示主頁面
function showMainPage() {
  loginPage.classList.add("hidden");
  mainPage.classList.remove("hidden");
  currentUserDisplay.textContent = `👤 ${currentUser}`;

  // 初始化頁面
  loadHiddenColors();
  renderColorThemes();
  loadWeekPanelVisibility();
  initCalendar();
  loadYearGoals();
  loadMonthGoal();
  setupRealtimeListeners();
}

// ==================== 修改密碼功能 ====================

// 開啟修改密碼彈窗
changePasswordBtn.addEventListener("click", () => {
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmPasswordInput.value = "";
  passwordError.textContent = "";
  passwordModal.classList.remove("hidden");
});

// 關閉修改密碼彈窗
closePasswordModal.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
});

// 點擊背景關閉
passwordModal.addEventListener("click", (e) => {
  if (e.target === passwordModal) {
    passwordModal.classList.add("hidden");
  }
});

// 儲存新密碼
savePasswordBtn.addEventListener("click", async () => {
  const currentPwd = currentPasswordInput.value;
  const newPwd = newPasswordInput.value;
  const confirmPwd = confirmPasswordInput.value;

  passwordError.textContent = "";

  // 驗證輸入
  if (!currentPwd || !newPwd || !confirmPwd) {
    passwordError.textContent = "請填寫所有欄位";
    return;
  }

  if (newPwd !== confirmPwd) {
    passwordError.textContent = "新密碼與確認密碼不一致";
    return;
  }

  if (newPwd.length < 6) {
    passwordError.textContent = "新密碼至少需要 6 個字元";
    return;
  }

  try {
    // 先驗證目前密碼
    const userRef = ref(db, `loginWhitelist/${currentUser}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      if (userData.password !== currentPwd) {
        passwordError.textContent = "目前密碼錯誤";
        return;
      }

      // 更新密碼
      await update(userRef, { password: newPwd });

      alert("密碼修改成功！");
      passwordModal.classList.add("hidden");
    } else {
      passwordError.textContent = "使用者資料不存在";
    }
  } catch (error) {
    console.error("修改密碼失敗:", error);
    passwordError.textContent = "修改密碼失敗，請稍後再試";
  }
});

// ==================== 日期工具函數 ====================

// 取得當月的 key (例如 "2025-01")
function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// 取得日期的 key (例如 "2025-01-03")
function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

// 取得今天的日期資訊
function getToday() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  };
}

// ==================== 月曆功能 ====================

function initCalendar() {
  renderCalendar();
}

function renderCalendar() {
  calendarTitle.textContent = `${currentYear} 年 ${currentMonth + 1} 月`;

  // 清空日曆格
  calendarGrid.innerHTML = "";

  // 取得當月第一天是星期幾
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  // 取得當月天數
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 取得今天
  const today = getToday();

  // 填入空白格 (月初之前)
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    calendarGrid.appendChild(emptyDiv);
  }

  // 填入日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    const dateKey = getDateKey(currentYear, currentMonth, day);
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();

    dayDiv.className = "calendar-day";
    dayDiv.dataset.date = dateKey;

    // 星期日/六 樣式
    if (dayOfWeek === 0) dayDiv.classList.add("sunday");
    if (dayOfWeek === 6) dayDiv.classList.add("saturday");

    // 今天的樣式
    if (
      currentYear === today.year &&
      currentMonth === today.month &&
      day === today.day
    ) {
      dayDiv.classList.add("today");
    }

    // 日期數字
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // 每日項目容器（Google 日曆風格）
    const dayItems = document.createElement("div");
    dayItems.className = "day-items";
    dayItems.id = `items-${dateKey}`;
    dayDiv.appendChild(dayItems);

    // 點擊事件
    dayDiv.addEventListener("click", () => openDailyModal(dateKey));

    // 拖曳放置事件
    dayDiv.addEventListener("dragover", handleDayDragOver);
    dayDiv.addEventListener("dragleave", handleDayDragLeave);
    dayDiv.addEventListener("drop", handleDayDrop);

    calendarGrid.appendChild(dayDiv);
  }

  // 填入空白格 (月末之後)
  const lastDay = new Date(currentYear, currentMonth, daysInMonth).getDay();
  const remainingDays = lastDay === 6 ? 0 : 6 - lastDay;
  for (let i = 0; i < remainingDays; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    calendarGrid.appendChild(emptyDiv);
  }

  // 更新日曆上的項目顯示
  updateCalendarStatus();
}

// 格子高度不夠時，超出的項目收成「還有 X 個」（點格子可看全部）
const DAY_ITEM_GAP = 2;

function clampDayItems(container) {
  const items = [...container.children].filter((el) =>
    el.classList.contains("day-item")
  );
  if (items.length === 0) return;

  const available = container.clientHeight;
  const rowHeight = items[0].offsetHeight + DAY_ITEM_GAP;
  if (!available || rowHeight <= DAY_ITEM_GAP) return;

  const fits = Math.floor((available + DAY_ITEM_GAP) / rowHeight);
  if (items.length <= fits) return;

  // 留一列給「還有 X 個」
  const visible = Math.max(fits - 1, 0);
  items.slice(visible).forEach((el) => (el.style.display = "none"));

  const hidden = items.length - visible;
  const more = document.createElement("div");
  more.className = "day-item-more";
  // 手機格子只有 50 多 px 寬，長字串會被截成「還有 …」
  more.textContent = window.innerWidth <= 600 ? `+${hidden}` : `還有 ${hidden} 個`;
  more.addEventListener("click", (e) => {
    // 這裡是「看全部」，不是進編輯模式，所以不讓事件冒泡到格子
    e.stopPropagation();
    openDayPeek(container.closest(".calendar-day"));
  });
  container.appendChild(more);
}

// ==================== 當日項目快速檢視 ====================

const dayPeek = document.getElementById("dayPeek");
const dayPeekDate = document.getElementById("dayPeekDate");
const dayPeekList = document.getElementById("dayPeekList");
const dayPeekClose = document.getElementById("dayPeekClose");
const dayPeekEditBtn = document.getElementById("dayPeekEditBtn");

let peekDateKey = null;

function renderDayPeek() {
  if (!peekDateKey) return;

  const [year, month, day] = peekDateKey.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  dayPeekDate.textContent = `${month} 月 ${day} 日（${WEEKDAY_LABELS[dayOfWeek]}）`;

  const items = dailyGoalsData[peekDateKey]?.items || {};
  const sortedIds = getDayItemsSorted(items);

  dayPeekList.innerHTML = "";
  let hiddenCount = 0;

  sortedIds.forEach((itemId) => {
    const item = items[itemId];
    const color = item.color || "blue";

    if (hiddenColors.has(color)) {
      hiddenCount++;
      return;
    }

    const row = document.createElement("div");
    row.className = `day-peek-item${
      item.completed ? " completed" : ""
    } item-color-${color}`;
    row.textContent = item.text;
    dayPeekList.appendChild(row);
  });

  if (sortedIds.length === 0) {
    const empty = document.createElement("p");
    empty.className = "day-peek-note";
    empty.textContent = "這天沒有項目";
    dayPeekList.appendChild(empty);
  } else if (hiddenCount > 0) {
    const note = document.createElement("p");
    note.className = "day-peek-note";
    note.textContent = `${hiddenCount} 個項目因顏色隱藏`;
    dayPeekList.appendChild(note);
  }
}

function openDayPeek(dayDiv) {
  if (!dayDiv) return;

  peekDateKey = dayDiv.dataset.date;
  renderDayPeek();
  dayPeek.classList.remove("hidden");

  // 先顯示才量得到尺寸，再夾在視窗範圍內
  const cell = dayDiv.getBoundingClientRect();
  const width = dayPeek.offsetWidth;
  const height = dayPeek.offsetHeight;

  const left = Math.min(
    Math.max(cell.left + cell.width / 2 - width / 2, 8),
    window.innerWidth - width - 8
  );
  const top = Math.min(
    Math.max(cell.top - 8, 8),
    window.innerHeight - height - 8
  );

  dayPeek.style.left = `${left}px`;
  dayPeek.style.top = `${top}px`;
}

function closeDayPeek() {
  dayPeek.classList.add("hidden");
  peekDateKey = null;
}

dayPeekClose.addEventListener("click", closeDayPeek);
dayPeek.addEventListener("click", (e) => e.stopPropagation());

// 「編輯這天」才進入原本的編輯彈窗
dayPeekEditBtn.addEventListener("click", () => {
  if (!peekDateKey) return;
  const dateKey = peekDateKey;
  closeDayPeek();
  openDailyModal(dateKey);
});

document.addEventListener("click", closeDayPeek);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDayPeek();
});
window.addEventListener("resize", closeDayPeek);

// 視窗大小改變時格子高度會變，重算一次
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentUser) updateCalendarStatus();
  }, 150);
});

// 取得日期項目排序後的 ID 列表
function getDayItemsSorted(items) {
  return Object.keys(items).sort((a, b) => {
    const orderA = items[a].order ?? 999999;
    const orderB = items[b].order ?? 999999;
    return orderA - orderB;
  });
}

// 更新日曆上的項目顯示
function updateCalendarStatus() {
  const days = calendarGrid.querySelectorAll(".calendar-day:not(.empty)");

  days.forEach((dayDiv) => {
    const dateKey = dayDiv.dataset.date;
    const data = dailyGoalsData[dateKey];
    const items = data?.items || {};

    // 清除完成狀態
    dayDiv.classList.remove("completed");

    // 更新項目顯示
    const dayItemsContainer = dayDiv.querySelector(".day-items");
    if (dayItemsContainer) {
      dayItemsContainer.innerHTML = "";

      // 按 order 排序顯示項目
      const sortedItemIds = getDayItemsSorted(items);

      sortedItemIds.forEach((itemId) => {
        const item = items[itemId];
        const color = item.color || "blue";

        // 顏色被隱藏的項目不顯示在日曆上（達成率仍照全部項目計算）
        if (hiddenColors.has(color)) return;

        const itemDiv = document.createElement("div");
        itemDiv.className = `day-item my-item${
          item.completed ? " completed" : ""
        } item-color-${color}`;
        itemDiv.textContent = item.text;
        itemDiv.dataset.itemId = itemId;
        itemDiv.dataset.dateKey = dateKey;
        itemDiv.dataset.itemText = item.text;
        itemDiv.dataset.itemCompleted = item.completed;
        itemDiv.dataset.itemColor = item.color || "";
        dayItemsContainer.appendChild(itemDiv);
      });

      // 為每個項目加上拖曳和點擊事件
      dayItemsContainer
        .querySelectorAll(".day-item.my-item")
        .forEach((itemDiv) => {
          itemDiv.draggable = true;
          let isDragging = false;

          itemDiv.addEventListener("mousedown", () => {
            isDragging = false;
          });

          itemDiv.addEventListener("dragstart", (e) => {
            isDragging = true;
            handleCalendarItemDragStart(e);
          });

          itemDiv.addEventListener("dragend", handleCalendarItemDragEnd);

          // 只有「同一天的另一個項目」才由項目自己處理排序；
          // 其他情況要讓事件冒泡到日期格，跨日搬移才不會被吞掉
          const isSameDayReorder = () =>
            draggedItem &&
            draggedItem.sourceDate === dateKey &&
            itemDiv.dataset.itemId !== draggedItem.itemId;

          itemDiv.addEventListener("dragover", (e) => {
            if (!isSameDayReorder()) return;
            e.preventDefault();
            e.stopPropagation();
            itemDiv.classList.add("drag-over-item");
          });

          itemDiv.addEventListener("dragleave", () => {
            itemDiv.classList.remove("drag-over-item");
          });

          itemDiv.addEventListener("drop", async (e) => {
            itemDiv.classList.remove("drag-over-item");
            if (!isSameDayReorder()) return;

            e.preventDefault();
            e.stopPropagation();

            const fromId = draggedItem.itemId;
            draggedItem = null;
            await reorderDayItems(dateKey, fromId, itemDiv.dataset.itemId);
          });

          // 點擊時打開該日的彈窗（只有在沒有拖曳時）
          itemDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isDragging) {
              openDailyModal(dateKey);
            }
            isDragging = false;
          });
        });

      clampDayItems(dayItemsContainer);
    }

    // 檢查是否所有項目都完成
    const itemKeys = Object.keys(items);
    if (itemKeys.length > 0) {
      const allCompleted = itemKeys.every((id) => items[id].completed === true);
      if (allCompleted) {
        dayDiv.classList.add("completed");
      }
    }
  });

  // 快速檢視開著的話，內容也要跟著更新
  if (peekDateKey) renderDayPeek();

  // 計算達成率
  calculateProgressRate();
}

// 切換到指定月份（跨年時一併重載年度目標）
function goToMonth(year, month) {
  const yearChanged = year !== currentYear;
  currentYear = year;
  currentMonth = month;
  renderCalendar();
  renderWeekGoals();
  loadMonthGoal();
  if (yearChanged) loadYearGoals();
}

// 上一月
prevMonthBtn.addEventListener("click", () => {
  const prev = currentMonth - 1;
  goToMonth(prev < 0 ? currentYear - 1 : currentYear, prev < 0 ? 11 : prev);
});

// 下一月
nextMonthBtn.addEventListener("click", () => {
  const next = currentMonth + 1;
  goToMonth(next > 11 ? currentYear + 1 : currentYear, next > 11 ? 0 : next);
});

// 回到今天
todayBtn.addEventListener("click", () => {
  const today = getToday();
  goToMonth(today.year, today.month);
});

// ==================== 每日項目彈窗 ====================

function openDailyModal(dateKey) {
  selectedDate = dateKey;

  // 格式化日期顯示
  const [year, month, day] = dateKey.split("-");
  modalDate.textContent = `${year} 年 ${parseInt(month)} 月 ${parseInt(
    day
  )} 日`;

  // 渲染現有項目列表
  renderItemsList();

  // 清空輸入框
  newItemInput.value = "";

  dailyModal.classList.remove("hidden");
}

// 彈窗內拖曳的項目
let draggedModalItem = null;

// 渲染項目列表
function renderItemsList() {
  if (!selectedDate) return;

  const data = dailyGoalsData[selectedDate];
  const items = data?.items || {};

  itemsList.innerHTML = "";

  // 按 order 排序
  const sortedItemIds = getDayItemsSorted(items);

  sortedItemIds.forEach((itemId) => {
    const item = items[itemId];
    const itemRow = document.createElement("div");
    // 整列就是那個顏色的色塊，跟日曆格子上的樣式一致
    // （沒存 color 的舊項目在日曆上是藍的，這裡也要跟著藍）
    itemRow.className = `item-row item-color-${item.color || "blue"}${
      item.completed ? " completed" : ""
    }`;
    itemRow.draggable = true;
    itemRow.dataset.id = itemId;
    itemRow.innerHTML = `
            <span class="item-drag-handle">⋮⋮</span>
            <input type="checkbox" class="item-checkbox" data-id="${itemId}" ${
      item.completed ? "checked" : ""
    } />
            <span class="item-text${item.completed ? " completed" : ""}">${
      item.text
    }</span>
            <div class="item-actions">
                <button class="item-apply" data-id="${itemId}" data-text="${
      item.text
    }" data-color="${item.color || ""}" title="套用到多天">📅</button>
                <button class="item-edit" data-id="${itemId}" data-text="${
      item.text
    }" data-color="${item.color || ""}" title="編輯">✎</button>
                <button class="item-delete" data-id="${itemId}" title="刪除">×</button>
            </div>
        `;

    // 拖曳事件
    itemRow.addEventListener("dragstart", (e) => {
      draggedModalItem = itemRow;
      itemRow.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    itemRow.addEventListener("dragend", () => {
      draggedModalItem = null;
      itemRow.classList.remove("dragging");
      document
        .querySelectorAll(".item-row.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    itemRow.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedModalItem && draggedModalItem !== itemRow) {
        itemRow.classList.add("drag-over");
      }
    });

    itemRow.addEventListener("dragleave", () => {
      itemRow.classList.remove("drag-over");
    });

    itemRow.addEventListener("drop", async (e) => {
      e.preventDefault();
      itemRow.classList.remove("drag-over");
      if (draggedModalItem && draggedModalItem !== itemRow) {
        const fromId = draggedModalItem.dataset.id;
        const toId = itemRow.dataset.id;
        await reorderDayItems(selectedDate, fromId, toId);
      }
    });

    itemsList.appendChild(itemRow);
  });

  // 綁定勾選事件
  itemsList.querySelectorAll(".item-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const itemId = e.target.dataset.id;
      toggleItemCompleted(itemId, e.target.checked);
    });
  });

  // 綁定套用到多天事件
  itemsList.querySelectorAll(".item-apply").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemText = e.target.dataset.text;
      const itemColor = e.target.dataset.color;
      openApplyScopeModal(itemText, itemColor);
    });
  });

  // 綁定編輯事件
  itemsList.querySelectorAll(".item-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.id;
      const itemText = e.target.dataset.text;
      const itemColor = e.target.dataset.color;
      openEditModal(itemId, itemText, itemColor);
    });
  });

  // 綁定刪除事件
  itemsList.querySelectorAll(".item-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.target.dataset.id;
      deleteItem(itemId);
    });
  });
}

// 新增項目
async function addItem() {
  if (!selectedDate || !currentUser) return;

  const text = newItemInput.value.trim();
  if (!text) {
    alert("請輸入項目內容");
    return;
  }

  try {
    // 計算新項目的 order（放在最後）
    const items = dailyGoalsData[selectedDate]?.items || {};
    const maxOrder = Object.values(items).reduce((max, item) => {
      return Math.max(max, item.order ?? 0);
    }, -1);

    // 產生唯一 ID
    const itemId = Date.now().toString();
    const itemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${selectedDate}/items/${itemId}`
    );
    const itemData = {
      text: text,
      completed: false,
      order: maxOrder + 1,
    };
    if (selectedNewItemColor && selectedNewItemColor !== "blue") {
      itemData.color = selectedNewItemColor;
    }
    await set(itemRef, itemData);

    newItemInput.value = "";
  } catch (error) {
    console.error("新增項目失敗:", error);
    alert("新增失敗，請稍後再試");
  }
}

// 切換項目完成狀態
async function toggleItemCompleted(itemId, completed) {
  if (!selectedDate || !currentUser) return;

  try {
    const itemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${selectedDate}/items/${itemId}`
    );
    await update(itemRef, { completed: completed });
  } catch (error) {
    console.error("更新狀態失敗:", error);
  }
}

// 刪除項目
async function deleteItem(itemId) {
  if (!selectedDate || !currentUser) return;

  const confirmDelete = confirm("確定要刪除此項目嗎？");
  if (!confirmDelete) return;

  try {
    const itemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${selectedDate}/items/${itemId}`
    );
    await set(itemRef, null);
  } catch (error) {
    console.error("刪除項目失敗:", error);
    alert("刪除失敗，請稍後再試");
  }
}

// 關閉彈窗
closeModal.addEventListener("click", () => {
  dailyModal.classList.add("hidden");
  selectedDate = null;
});

// 點擊背景關閉
dailyModal.addEventListener("click", (e) => {
  if (e.target === dailyModal) {
    dailyModal.classList.add("hidden");
    selectedDate = null;
  }
});

// 新增項目按鈕
addItemBtn.addEventListener("click", addItem);

// Enter 鍵新增項目
newItemInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addItem();
  }
});

// 新增項目顏色選擇
newItemColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    newItemColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedNewItemColor = e.target.dataset.color;
  });
});

// 編輯項目顏色選擇
editItemColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    editItemColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedEditItemColor = e.target.dataset.color;
  });
});

// ==================== 拖曳功能 ====================

// 日曆上的項目拖曳開始
function handleCalendarItemDragStart(e) {
  e.stopPropagation();
  const itemDiv = e.target;
  draggedItem = {
    itemId: itemDiv.dataset.itemId,
    text: itemDiv.dataset.itemText,
    completed: itemDiv.dataset.itemCompleted === "true",
    color: itemDiv.dataset.itemColor || "",
    sourceDate: itemDiv.dataset.dateKey,
  };
  itemDiv.classList.add("dragging");

  // 設置拖曳效果
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", itemDiv.dataset.itemText);
}

// 日曆上的項目拖曳結束
function handleCalendarItemDragEnd(e) {
  e.target.classList.remove("dragging");
  document.querySelectorAll(".calendar-day").forEach((day) => {
    day.classList.remove("drag-over");
  });
}

function handleDayDragOver(e) {
  e.preventDefault();
  if (draggedItem) {
    e.currentTarget.classList.add("drag-over");
  }
}

function handleDayDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

async function handleDayDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  if (!draggedItem || !currentUser) return;

  const targetDate = e.currentTarget.dataset.date;

  // 不能放到同一天
  if (targetDate === draggedItem.sourceDate) {
    draggedItem = null;
    return;
  }

  // 檢查目標日期是否已有相同項目
  const targetData = dailyGoalsData[targetDate];
  const targetItems = targetData?.items || {};
  const hasDuplicate = Object.values(targetItems).some(
    (item) => item.text === draggedItem.text
  );

  if (hasDuplicate) {
    const confirmMove = confirm(
      `「${draggedItem.text}」在 ${formatDateDisplay(
        targetDate
      )} 已存在，是否仍要移動？\n\n（會產生重複項目）`
    );
    if (!confirmMove) {
      draggedItem = null;
      return;
    }
  }

  try {
    // 計算目標日期的最大 order
    const maxOrder = Object.values(targetItems).reduce((max, item) => {
      return Math.max(max, item.order ?? 0);
    }, -1);

    // 在目標日期新增項目
    const newItemId = Date.now().toString();
    const newItemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${targetDate}/items/${newItemId}`
    );
    const newItemData = {
      text: draggedItem.text,
      completed: draggedItem.completed,
      order: maxOrder + 1,
    };
    if (draggedItem.color) {
      newItemData.color = draggedItem.color;
    }
    await set(newItemRef, newItemData);

    // 從原日期刪除項目
    const oldItemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${draggedItem.sourceDate}/items/${draggedItem.itemId}`
    );
    await set(oldItemRef, null);
  } catch (error) {
    console.error("移動項目失敗:", error);
    alert("移動失敗，請稍後再試");
  }

  draggedItem = null;
}

// 同一天內重新排序項目
async function reorderDayItems(dateKey, fromId, toId) {
  if (!currentUser) return;

  const items = dailyGoalsData[dateKey]?.items || {};
  const sortedIds = getDayItemsSorted(items);
  const fromIndex = sortedIds.indexOf(fromId);
  const toIndex = sortedIds.indexOf(toId);

  if (fromIndex === -1 || toIndex === -1) return;

  // 移動元素
  sortedIds.splice(fromIndex, 1);
  sortedIds.splice(toIndex, 0, fromId);

  // 更新所有項目的 order
  const updates = {};
  sortedIds.forEach((id, index) => {
    updates[`${dateKey}/items/${id}/order`] = index;
  });

  try {
    const dailyGoalsRef = ref(db, `users/${currentUser}/dailyGoals`);
    await update(dailyGoalsRef, updates);
  } catch (error) {
    console.error("重新排序項目失敗:", error);
  }
}

// 格式化日期顯示
function formatDateDisplay(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

// ==================== 套用範圍（整月／平日／假日／指定星期） ====================

const applyScopeModal = document.getElementById("applyScopeModal");
const closeApplyScopeModal = document.getElementById("closeApplyScopeModal");
const applyScopeTarget = document.getElementById("applyScopeTarget");
const applyPresetGroup = document.getElementById("applyPresetGroup");
const weekdayPicker = document.getElementById("weekdayPicker");
const applyScopePreview = document.getElementById("applyScopePreview");
const confirmApplyScopeBtn = document.getElementById("confirmApplyScopeBtn");

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const APPLY_PRESETS = {
  all: [0, 1, 2, 3, 4, 5, 6],
  weekday: [1, 2, 3, 4, 5],
  weekend: [0, 6],
};

// 目前要套用的項目 { text, color }
let applyScopeContext = null;

// 建立一組「預設 + 星期」選擇器，回傳目前選到的星期
function createScopePicker(presetGroup, picker, onChange) {
  let selected = new Set(APPLY_PRESETS.all);

  // 找出目前選擇對應哪個預設（找不到就是「自訂」）
  function matchedPreset() {
    return (
      Object.keys(APPLY_PRESETS).find((preset) => {
        const days = APPLY_PRESETS[preset];
        return (
          days.length === selected.size && days.every((d) => selected.has(d))
        );
      }) || "custom"
    );
  }

  function render() {
    const preset = matchedPreset();
    presetGroup.querySelectorAll(".apply-preset").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === preset);
    });
    picker.querySelectorAll(".weekday-chip").forEach((chip) => {
      chip.classList.toggle("on", selected.has(Number(chip.dataset.day)));
    });
    onChange();
  }

  WEEKDAY_LABELS.forEach((label, dayOfWeek) => {
    const chip = document.createElement("button");
    chip.className = "weekday-chip";
    chip.dataset.day = dayOfWeek;
    chip.textContent = label;
    chip.addEventListener("click", () => {
      if (selected.has(dayOfWeek)) {
        selected.delete(dayOfWeek);
      } else {
        selected.add(dayOfWeek);
      }
      render();
    });
    picker.appendChild(chip);
  });

  presetGroup.querySelectorAll(".apply-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      // 「自訂」只是狀態顯示，不改變目前選擇
      if (btn.dataset.preset === "custom") return;
      selected = new Set(APPLY_PRESETS[btn.dataset.preset]);
      render();
    });
  });

  return {
    get days() {
      return selected;
    },
    reset() {
      selected = new Set(APPLY_PRESETS.all);
      render();
    },
    render,
  };
}

// 走訪當月符合星期條件的日期
function forEachDayInScope(weekdays, callback) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    if (!weekdays.has(dayOfWeek)) continue;
    const dateKey = getDateKey(currentYear, currentMonth, day);
    callback(dateKey, dailyGoalsData[dateKey]?.items || {});
  }
}

const applyScopePicker = createScopePicker(
  applyPresetGroup,
  weekdayPicker,
  renderApplyScopePreview
);

function renderApplyScopePreview() {
  if (!applyScopeContext) return;

  const { text } = applyScopeContext;
  let willAdd = 0;
  let skipped = 0;

  forEachDayInScope(applyScopePicker.days, (dateKey, items) => {
    if (Object.values(items).some((item) => item.text === text)) {
      skipped++;
    } else {
      willAdd++;
    }
  });

  const skipText = skipped > 0 ? `，另有 ${skipped} 天已存在會跳過` : "";
  applyScopePreview.textContent =
    applyScopePicker.days.size === 0
      ? "請至少選擇一個星期"
      : `將新增到 ${willAdd} 天${skipText}`;
  confirmApplyScopeBtn.disabled = willAdd === 0;
}

// 開啟套用範圍彈窗
function openApplyScopeModal(text, color) {
  applyScopeContext = { text, color };
  applyScopeTarget.innerHTML = `將「<strong>${text}</strong>」套用到 ${currentYear} 年 ${
    currentMonth + 1
  } 月的：`;
  applyScopePicker.reset();
  applyScopeModal.classList.remove("hidden");
}

function closeApplyScope() {
  applyScopeModal.classList.add("hidden");
  applyScopeContext = null;
}

closeApplyScopeModal.addEventListener("click", closeApplyScope);
applyScopeModal.addEventListener("click", (e) => {
  if (e.target === applyScopeModal) closeApplyScope();
});

confirmApplyScopeBtn.addEventListener("click", async () => {
  if (!applyScopeContext || !currentUser) return;

  const { text, color } = applyScopeContext;
  const selectedWeekdays = applyScopePicker.days;

  try {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const baseId = Date.now().toString();
    const updates = {};
    let addedCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
      if (!selectedWeekdays.has(dayOfWeek)) continue;

      const dateKey = getDateKey(currentYear, currentMonth, day);
      const items = dailyGoalsData[dateKey]?.items || {};

      // 該日已有相同名稱的項目就跳過
      if (Object.values(items).some((item) => item.text === text)) continue;

      // 計算該日的最大 order
      const maxOrder = Object.values(items).reduce((max, item) => {
        return Math.max(max, item.order ?? 0);
      }, -1);

      const itemData = {
        text: text,
        completed: false,
        order: maxOrder + 1,
      };
      if (color && color !== "blue") {
        itemData.color = color;
      }
      updates[`${dateKey}/items/${baseId}_${day}`] = itemData;
      addedCount++;
    }

    if (addedCount === 0) {
      alert("選到的日期都已有此項目");
      return;
    }

    const dailyGoalsRef = ref(db, `users/${currentUser}/dailyGoals`);
    await update(dailyGoalsRef, updates);

    closeApplyScope();
    alert(`已成功將「${text}」新增到 ${addedCount} 天！`);
  } catch (error) {
    console.error("套用失敗:", error);
    alert("套用失敗，請稍後再試");
  }
});

// ==================== 編輯項目功能 ====================

// 開啟編輯彈窗
function openEditModal(itemId, itemText, itemColor) {
  editingItemId = itemId;
  editingItemOriginalText = itemText;
  editingItemOriginalColor = itemColor || "blue";
  editItemInput.value = itemText;

  // 設置顏色選擇器
  selectedEditItemColor = itemColor || "blue";
  editItemColorPicker.querySelectorAll(".color-option").forEach((o) => {
    o.classList.remove("selected");
    if (o.dataset.color === selectedEditItemColor) {
      o.classList.add("selected");
    }
  });

  editItemModal.classList.remove("hidden");
}

// 關閉編輯彈窗
closeEditModal.addEventListener("click", () => {
  editItemModal.classList.add("hidden");
  editingItemId = null;
  editingItemOriginalText = null;
  editingItemOriginalColor = null;
});

editItemModal.addEventListener("click", (e) => {
  if (e.target === editItemModal) {
    editItemModal.classList.add("hidden");
    editingItemId = null;
    editingItemOriginalText = null;
    editingItemOriginalColor = null;
  }
});

// 儲存編輯（只修改當天）
saveEditBtn.addEventListener("click", async () => {
  if (!selectedDate || !currentUser || !editingItemId) return;

  const newText = editItemInput.value.trim();
  if (!newText) {
    alert("請輸入項目內容");
    return;
  }

  try {
    const itemRef = ref(
      db,
      `users/${currentUser}/dailyGoals/${selectedDate}/items/${editingItemId}`
    );
    const updateData = { text: newText };
    if (selectedEditItemColor && selectedEditItemColor !== "blue") {
      updateData.color = selectedEditItemColor;
    } else {
      updateData.color = null; // 移除顏色屬性
    }
    await update(itemRef, updateData);

    editItemModal.classList.add("hidden");
    editingItemId = null;
    editingItemOriginalText = null;
    editingItemOriginalColor = null;
  } catch (error) {
    console.error("修改失敗:", error);
    alert("修改失敗，請稍後再試");
  }
});

// 修改並套用到全月（修改所有相同名稱的項目）
saveAndApplyEditBtn.addEventListener("click", async () => {
  if (!currentUser || !editingItemOriginalText) return;

  const newText = editItemInput.value.trim();
  if (!newText) {
    alert("請輸入項目內容");
    return;
  }

  const textChanged = newText !== editingItemOriginalText;
  const colorChanged = selectedEditItemColor !== editingItemOriginalColor;

  if (!textChanged && !colorChanged) {
    alert("沒有任何變更");
    return;
  }

  const confirmApply = confirm(
    `確定要將 ${currentYear} 年 ${
      currentMonth + 1
    } 月所有「${editingItemOriginalText}」修改嗎？`
  );
  if (!confirmApply) return;

  try {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const updates = {};
    let count = 0;

    // 遍歷當月每一天，找出所有相同名稱的項目
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(currentYear, currentMonth, day);
      const data = dailyGoalsData[dateKey];
      const items = data?.items || {};

      Object.keys(items).forEach((itemId) => {
        if (items[itemId].text === editingItemOriginalText) {
          if (textChanged) {
            updates[`${dateKey}/items/${itemId}/text`] = newText;
          }
          if (colorChanged) {
            if (selectedEditItemColor && selectedEditItemColor !== "blue") {
              updates[`${dateKey}/items/${itemId}/color`] =
                selectedEditItemColor;
            } else {
              updates[`${dateKey}/items/${itemId}/color`] = null;
            }
          }
          count++;
        }
      });
    }

    if (count === 0) {
      alert("找不到符合的項目");
      return;
    }

    const dailyGoalsRef = ref(db, `users/${currentUser}/dailyGoals`);
    await update(dailyGoalsRef, updates);

    editItemModal.classList.add("hidden");
    editingItemId = null;
    editingItemOriginalText = null;
    editingItemOriginalColor = null;

    alert(`已成功修改 ${count} 個項目！`);
  } catch (error) {
    console.error("批次修改失敗:", error);
    alert("修改失敗，請稍後再試");
  }
});

// ==================== 年度目標（多項目） ====================

let yearGoalsData = {};

async function loadYearGoals() {
  if (!currentUser) return;

  yearGoalsPanelTitle.textContent = `🎯 ${currentYear} 年度目標`;

  const yearKey = currentYear.toString();
  const yearGoalsRef = ref(
    db,
    `users/${currentUser}/yearlyGoals/${yearKey}/items`
  );

  try {
    const snapshot = await get(yearGoalsRef);
    if (snapshot.exists()) {
      yearGoalsData = snapshot.val();
    } else {
      yearGoalsData = {};
    }
    renderYearGoalsList();
  } catch (error) {
    console.error("讀取年度目標失敗:", error);
  }
}

function getYearGoalsSorted() {
  // 按 order 排序，沒有 order 的放最後
  return Object.keys(yearGoalsData).sort((a, b) => {
    const orderA = yearGoalsData[a].order ?? 999999;
    const orderB = yearGoalsData[b].order ?? 999999;
    return orderA - orderB;
  });
}

function renderYearGoalsList() {
  yearGoalsList.innerHTML = "";

  const sortedIds = getYearGoalsSorted();

  sortedIds.forEach((itemId) => {
    const item = yearGoalsData[itemId];
    const colorClass = item.color ? ` color-${item.color}` : " color-blue";
    const goalItem = document.createElement("div");
    goalItem.className = `year-goal-item${
      item.completed ? " completed" : ""
    }${colorClass}`;
    goalItem.draggable = true;
    goalItem.dataset.id = itemId;
    goalItem.innerHTML = `
            <span class="year-goal-drag-handle">⋮⋮</span>
            <input type="checkbox" class="year-goal-checkbox" data-id="${itemId}" ${
      item.completed ? "checked" : ""
    } />
            <span class="year-goal-text" data-id="${itemId}">${item.text}</span>
            <button class="year-goal-delete" data-id="${itemId}">×</button>
        `;
    yearGoalsList.appendChild(goalItem);

    // 拖曳事件
    goalItem.addEventListener("dragstart", (e) => {
      draggedYearGoal = goalItem;
      goalItem.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    goalItem.addEventListener("dragend", () => {
      draggedYearGoal = null;
      goalItem.classList.remove("dragging");
      document
        .querySelectorAll(".year-goal-item.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    goalItem.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedYearGoal && draggedYearGoal !== goalItem) {
        goalItem.classList.add("drag-over");
      }
    });

    goalItem.addEventListener("dragleave", () => {
      goalItem.classList.remove("drag-over");
    });

    goalItem.addEventListener("drop", async (e) => {
      e.preventDefault();
      goalItem.classList.remove("drag-over");
      if (draggedYearGoal && draggedYearGoal !== goalItem) {
        const fromId = draggedYearGoal.dataset.id;
        const toId = goalItem.dataset.id;
        await reorderYearGoals(fromId, toId);
      }
    });
  });

  // 綁定事件
  yearGoalsList.querySelectorAll(".year-goal-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleYearGoalItem(e.target.dataset.id, e.target.checked);
    });
  });
  yearGoalsList.querySelectorAll(".year-goal-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteYearGoalItem(e.target.dataset.id);
    });
  });
  yearGoalsList.querySelectorAll(".year-goal-text").forEach((text) => {
    text.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditYearGoalModal(e.target.dataset.id);
    });
  });
}

async function reorderYearGoals(fromId, toId) {
  const sortedIds = getYearGoalsSorted();
  const fromIndex = sortedIds.indexOf(fromId);
  const toIndex = sortedIds.indexOf(toId);

  // 移動元素
  sortedIds.splice(fromIndex, 1);
  sortedIds.splice(toIndex, 0, fromId);

  // 更新所有項目的 order
  const yearKey = currentYear.toString();
  const updates = {};
  sortedIds.forEach((id, index) => {
    updates[`users/${currentUser}/yearlyGoals/${yearKey}/items/${id}/order`] =
      index;
  });

  try {
    await update(ref(db), updates);
    await loadYearGoals();
  } catch (error) {
    console.error("重新排序失敗:", error);
  }
}

function openEditYearGoalModal(itemId) {
  const item = yearGoalsData[itemId];
  if (!item) return;

  editingYearGoalId = itemId;
  editYearGoalInput.value = item.text;
  selectedEditYearGoalColor = item.color || "blue";

  // 更新顏色選擇器
  editYearGoalColorPicker.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.toggle(
      "selected",
      opt.dataset.color === selectedEditYearGoalColor
    );
  });

  editYearGoalModal.classList.remove("hidden");
}

async function saveEditYearGoal() {
  if (!editingYearGoalId || !currentUser) return;

  const newText = editYearGoalInput.value.trim();
  if (!newText) {
    alert("請輸入年度目標");
    return;
  }

  const yearKey = currentYear.toString();
  const itemRef = ref(
    db,
    `users/${currentUser}/yearlyGoals/${yearKey}/items/${editingYearGoalId}`
  );

  try {
    const updateData = { text: newText };
    if (selectedEditYearGoalColor) {
      updateData.color = selectedEditYearGoalColor;
    }
    await update(itemRef, updateData);
    editYearGoalModal.classList.add("hidden");
    editingYearGoalId = null;
    await loadYearGoals();
  } catch (error) {
    console.error("更新年度目標失敗:", error);
    alert("更新失敗，請稍後再試");
  }
}

async function addYearGoalItem() {
  if (!currentUser) return;

  const text = yearGoalInput.value.trim();
  if (!text) {
    alert("請輸入年度目標");
    return;
  }

  const yearKey = currentYear.toString();
  const itemId = Date.now().toString();
  const itemRef = ref(
    db,
    `users/${currentUser}/yearlyGoals/${yearKey}/items/${itemId}`
  );

  // 計算新項目的 order（放在最後）
  const maxOrder = Object.values(yearGoalsData).reduce((max, item) => {
    return Math.max(max, item.order ?? 0);
  }, -1);

  try {
    const itemData = { text: text, completed: false, order: maxOrder + 1 };
    if (selectedYearGoalColor && selectedYearGoalColor !== "blue") {
      itemData.color = selectedYearGoalColor;
    }
    await set(itemRef, itemData);
    yearGoalInput.value = "";
    await loadYearGoals();
  } catch (error) {
    console.error("新增年度目標失敗:", error);
    alert("新增失敗，請稍後再試");
  }
}

async function toggleYearGoalItem(itemId, completed) {
  if (!currentUser) return;

  const yearKey = currentYear.toString();
  const itemRef = ref(
    db,
    `users/${currentUser}/yearlyGoals/${yearKey}/items/${itemId}`
  );

  try {
    await update(itemRef, { completed: completed });
    await loadYearGoals();
  } catch (error) {
    console.error("更新年度目標狀態失敗:", error);
  }
}

async function deleteYearGoalItem(itemId) {
  if (!currentUser) return;
  if (!confirm("確定要刪除此年度目標嗎？")) return;

  const yearKey = currentYear.toString();
  const itemRef = ref(
    db,
    `users/${currentUser}/yearlyGoals/${yearKey}/items/${itemId}`
  );

  try {
    await set(itemRef, null);
    await loadYearGoals();
  } catch (error) {
    console.error("刪除年度目標失敗:", error);
  }
}

// 年度目標顏色選擇
yearGoalColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    yearGoalColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedYearGoalColor = e.target.dataset.color;
  });
});

// 年度目標按鈕事件
addYearGoalBtn.addEventListener("click", addYearGoalItem);
yearGoalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addYearGoalItem();
});

// 編輯年度目標彈窗事件
closeEditYearGoalModal.addEventListener("click", () => {
  editYearGoalModal.classList.add("hidden");
  editingYearGoalId = null;
});

editYearGoalModal.addEventListener("click", (e) => {
  if (e.target === editYearGoalModal) {
    editYearGoalModal.classList.add("hidden");
    editingYearGoalId = null;
  }
});

editYearGoalColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    editYearGoalColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedEditYearGoalColor = e.target.dataset.color;
  });
});

saveEditYearGoalBtn.addEventListener("click", saveEditYearGoal);
editYearGoalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") saveEditYearGoal();
});

// ==================== 月目標（多項目） ====================

let monthGoalsData = {};

async function loadMonthGoal() {
  if (!currentUser) return;

  // 更新月目標標題
  monthGoalTitle.textContent = `📅 ${currentMonth + 1}月目標`;

  const monthKey = getMonthKey(currentYear, currentMonth);
  const monthGoalRef = ref(
    db,
    `users/${currentUser}/monthlyGoals/${monthKey}/items`
  );

  try {
    const snapshot = await get(monthGoalRef);
    if (snapshot.exists()) {
      monthGoalsData = snapshot.val();
    } else {
      monthGoalsData = {};
    }
    renderMonthGoalsList();
  } catch (error) {
    console.error("讀取月目標失敗:", error);
  }
}

function getMonthGoalsSorted() {
  // 按 order 排序，沒有 order 的放最後
  return Object.keys(monthGoalsData).sort((a, b) => {
    const orderA = monthGoalsData[a].order ?? 999999;
    const orderB = monthGoalsData[b].order ?? 999999;
    return orderA - orderB;
  });
}

function renderMonthGoalsList() {
  monthGoalsList.innerHTML = "";

  const sortedIds = getMonthGoalsSorted();

  sortedIds.forEach((itemId) => {
    const item = monthGoalsData[itemId];
    const colorClass = item.color ? ` color-${item.color}` : " color-blue";
    const row = document.createElement("div");
    row.className = `goal-item-row${
      item.completed ? " completed" : ""
    }${colorClass}`;
    row.draggable = true;
    row.dataset.id = itemId;
    row.innerHTML = `
            <span class="goal-item-drag-handle">⋮⋮</span>
            <input type="checkbox" class="goal-item-checkbox" data-id="${itemId}" ${
      item.completed ? "checked" : ""
    } />
            <span class="goal-item-text" data-id="${itemId}">${item.text}</span>
            <button class="goal-item-delete" data-id="${itemId}">×</button>
        `;
    monthGoalsList.appendChild(row);

    // 拖曳事件
    row.addEventListener("dragstart", (e) => {
      draggedMonthGoal = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragend", () => {
      draggedMonthGoal = null;
      row.classList.remove("dragging");
      document
        .querySelectorAll(".goal-item-row.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedMonthGoal && draggedMonthGoal !== row) {
        row.classList.add("drag-over");
      }
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-over");
    });

    row.addEventListener("drop", async (e) => {
      e.preventDefault();
      row.classList.remove("drag-over");
      if (draggedMonthGoal && draggedMonthGoal !== row) {
        const fromId = draggedMonthGoal.dataset.id;
        const toId = row.dataset.id;
        await reorderMonthGoals(fromId, toId);
      }
    });
  });

  // 綁定事件
  monthGoalsList.querySelectorAll(".goal-item-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleMonthGoalItem(e.target.dataset.id, e.target.checked);
    });
  });
  monthGoalsList.querySelectorAll(".goal-item-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteMonthGoalItem(e.target.dataset.id);
    });
  });
  monthGoalsList.querySelectorAll(".goal-item-text").forEach((text) => {
    text.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditMonthGoalModal(e.target.dataset.id);
    });
  });
}

async function reorderMonthGoals(fromId, toId) {
  const sortedIds = getMonthGoalsSorted();
  const fromIndex = sortedIds.indexOf(fromId);
  const toIndex = sortedIds.indexOf(toId);

  // 移動元素
  sortedIds.splice(fromIndex, 1);
  sortedIds.splice(toIndex, 0, fromId);

  // 更新所有項目的 order
  const monthKey = getMonthKey(currentYear, currentMonth);
  const updates = {};
  sortedIds.forEach((id, index) => {
    updates[`users/${currentUser}/monthlyGoals/${monthKey}/items/${id}/order`] =
      index;
  });

  try {
    await update(ref(db), updates);
    await loadMonthGoal();
  } catch (error) {
    console.error("重新排序失敗:", error);
  }
}

function openEditMonthGoalModal(itemId) {
  const item = monthGoalsData[itemId];
  if (!item) return;

  editingMonthGoalId = itemId;
  editMonthGoalInput.value = item.text;
  selectedEditMonthGoalColor = item.color || "blue";

  // 更新顏色選擇器
  editMonthGoalColorPicker.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.toggle(
      "selected",
      opt.dataset.color === selectedEditMonthGoalColor
    );
  });

  editMonthGoalModal.classList.remove("hidden");
}

async function saveEditMonthGoal() {
  if (!editingMonthGoalId || !currentUser) return;

  const newText = editMonthGoalInput.value.trim();
  if (!newText) {
    alert("請輸入月目標");
    return;
  }

  const monthKey = getMonthKey(currentYear, currentMonth);
  const itemRef = ref(
    db,
    `users/${currentUser}/monthlyGoals/${monthKey}/items/${editingMonthGoalId}`
  );

  try {
    const updateData = { text: newText };
    if (selectedEditMonthGoalColor) {
      updateData.color = selectedEditMonthGoalColor;
    }
    await update(itemRef, updateData);
    editMonthGoalModal.classList.add("hidden");
    editingMonthGoalId = null;
    await loadMonthGoal();
  } catch (error) {
    console.error("更新月目標失敗:", error);
    alert("更新失敗，請稍後再試");
  }
}

async function addMonthGoalItem() {
  if (!currentUser) return;

  const text = monthGoalInput.value.trim();
  if (!text) {
    alert("請輸入月目標");
    return;
  }

  const monthKey = getMonthKey(currentYear, currentMonth);
  const itemId = Date.now().toString();
  const itemRef = ref(
    db,
    `users/${currentUser}/monthlyGoals/${monthKey}/items/${itemId}`
  );

  // 計算新項目的 order（放在最後）
  const maxOrder = Object.values(monthGoalsData).reduce((max, item) => {
    return Math.max(max, item.order ?? 0);
  }, -1);

  try {
    const itemData = { text: text, completed: false, order: maxOrder + 1 };
    if (selectedMonthGoalColor && selectedMonthGoalColor !== "blue") {
      itemData.color = selectedMonthGoalColor;
    }
    await set(itemRef, itemData);
    monthGoalInput.value = "";
    await loadMonthGoal();
  } catch (error) {
    console.error("新增月目標失敗:", error);
    alert("新增失敗，請稍後再試");
  }
}

async function toggleMonthGoalItem(itemId, completed) {
  if (!currentUser) return;

  const monthKey = getMonthKey(currentYear, currentMonth);
  const itemRef = ref(
    db,
    `users/${currentUser}/monthlyGoals/${monthKey}/items/${itemId}`
  );

  try {
    await update(itemRef, { completed: completed });
    await loadMonthGoal();
  } catch (error) {
    console.error("更新月目標狀態失敗:", error);
  }
}

async function deleteMonthGoalItem(itemId) {
  if (!currentUser) return;
  if (!confirm("確定要刪除此月目標嗎？")) return;

  const monthKey = getMonthKey(currentYear, currentMonth);
  const itemRef = ref(
    db,
    `users/${currentUser}/monthlyGoals/${monthKey}/items/${itemId}`
  );

  try {
    await set(itemRef, null);
    await loadMonthGoal();
  } catch (error) {
    console.error("刪除月目標失敗:", error);
  }
}

// 月目標顏色選擇
monthGoalColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    monthGoalColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedMonthGoalColor = e.target.dataset.color;
  });
});

addMonthGoalBtn.addEventListener("click", addMonthGoalItem);
monthGoalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addMonthGoalItem();
});

// 編輯月目標彈窗事件
closeEditMonthGoalModal.addEventListener("click", () => {
  editMonthGoalModal.classList.add("hidden");
  editingMonthGoalId = null;
});

editMonthGoalModal.addEventListener("click", (e) => {
  if (e.target === editMonthGoalModal) {
    editMonthGoalModal.classList.add("hidden");
    editingMonthGoalId = null;
  }
});

editMonthGoalColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    editMonthGoalColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedEditMonthGoalColor = e.target.dataset.color;
  });
});

saveEditMonthGoalBtn.addEventListener("click", saveEditMonthGoal);
editMonthGoalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") saveEditMonthGoal();
});

// ==================== 週目標 ====================

let weeklyGoalsData = {};

// 編輯中的週目標 { weekKey, itemId | null }
let editingWeekGoal = null;
let selectedWeekGoalColor = "blue";

// 一週以週日為起點，用該日的 dateKey 當 key（跨月的週在兩個月看到的是同一組）
function getWeekKeyFromDate(date) {
  const sunday = new Date(date);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return getDateKey(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
}

// 取得當月日曆上出現的每一週
function getMonthWeeks() {
  const weeks = [];
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const lastDay = new Date(currentYear, currentMonth, lastDate);

  const cursor = new Date(firstDay);
  cursor.setDate(1 - firstDay.getDay());

  while (cursor <= lastDay) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    weeks.push({
      key: getDateKey(start.getFullYear(), start.getMonth(), start.getDate()),
      start,
      end,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function formatWeekRange(start, end) {
  return `${start.getMonth() + 1}/${start.getDate()} – ${
    end.getMonth() + 1
  }/${end.getDate()}`;
}

function getWeekGoalsSorted(items) {
  return Object.keys(items).sort((a, b) => {
    const orderA = items[a].order ?? 999999;
    const orderB = items[b].order ?? 999999;
    return orderA - orderB;
  });
}

function getColorHex(key) {
  return COLOR_DEFS.find((c) => c.key === key)?.hex || "#3498DB";
}

// 拖曳中的週目標 { weekKey, itemId }
let draggedWeekGoal = null;

function renderWeekGoals() {
  weekPanelBody.innerHTML = "";

  const today = getToday();
  const todayWeekKey = getWeekKeyFromDate(
    new Date(today.year, today.month, today.day)
  );

  getMonthWeeks().forEach((week, index) => {
    const card = document.createElement("div");
    card.className = "week-card";
    if (week.key === todayWeekKey) card.classList.add("current");

    const header = document.createElement("div");
    header.className = "week-card-header";

    const badge = document.createElement("span");
    badge.className = "week-badge";
    badge.textContent = `第 ${index + 1} 週`;

    const range = document.createElement("span");
    range.className = "week-card-range";
    range.textContent = formatWeekRange(week.start, week.end);

    const addBtn = document.createElement("button");
    addBtn.className = "week-add-btn";
    addBtn.textContent = "＋";
    addBtn.title = "新增週目標";
    addBtn.addEventListener("click", () => openWeekGoalModal(week));

    header.append(badge, range, addBtn);
    card.appendChild(header);

    const list = document.createElement("div");
    list.className = "week-card-list";

    const items = weeklyGoalsData[week.key]?.items || {};
    const sortedIds = getWeekGoalsSorted(items);
    let hiddenCount = 0;

    sortedIds.forEach((itemId) => {
      const item = items[itemId];
      const color = item.color || "blue";

      // 顏色被隱藏時，這條週目標也一起隱藏
      if (hiddenColors.has(color)) {
        hiddenCount++;
        return;
      }

      list.appendChild(createWeekGoalRow(week, itemId, item, color));
    });

    card.appendChild(list);

    if (sortedIds.length === 0) {
      const empty = document.createElement("p");
      empty.className = "week-card-empty";
      empty.textContent = "尚未設定";
      card.appendChild(empty);
    } else if (hiddenCount > 0) {
      const note = document.createElement("p");
      note.className = "week-card-empty";
      note.textContent = `${hiddenCount} 個項目因顏色隱藏`;
      card.appendChild(note);
    }

    // 拖到別週的卡片＝搬到那一週
    card.addEventListener("dragover", (e) => {
      if (!draggedWeekGoal || draggedWeekGoal.weekKey === week.key) return;
      e.preventDefault();
      card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", async (e) => {
      card.classList.remove("drag-over");
      if (!draggedWeekGoal || draggedWeekGoal.weekKey === week.key) return;
      e.preventDefault();
      const { weekKey, itemId } = draggedWeekGoal;
      draggedWeekGoal = null;
      await moveWeekGoal(weekKey, itemId, week.key);
    });

    weekPanelBody.appendChild(card);
  });
}

function createWeekGoalRow(week, itemId, item, color) {
  const row = document.createElement("div");
  row.className = `week-goal-row item-color-${color}${
    item.completed ? " completed" : ""
  }`;
  row.draggable = true;
  row.dataset.id = itemId;

  const handle = document.createElement("span");
  handle.className = "week-goal-handle";
  handle.textContent = "⋮⋮";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "week-goal-checkbox";
  checkbox.checked = !!item.completed;
  checkbox.addEventListener("change", () =>
    toggleWeekGoalItem(week.key, itemId, checkbox.checked)
  );

  const text = document.createElement("span");
  text.className = "week-goal-text";
  text.textContent = item.text;
  text.title = "點擊編輯";
  text.addEventListener("click", () => openWeekGoalModal(week, itemId, item));

  const del = document.createElement("button");
  del.className = "week-goal-delete";
  del.textContent = "×";
  del.title = "刪除";
  del.addEventListener("click", () => deleteWeekGoalItem(week.key, itemId));

  row.append(handle, checkbox, text, del);

  // 拖曳排序
  row.addEventListener("dragstart", (e) => {
    draggedWeekGoal = { weekKey: week.key, itemId };
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.text);
  });

  row.addEventListener("dragend", () => {
    draggedWeekGoal = null;
    row.classList.remove("dragging");
    document
      .querySelectorAll(".week-goal-row.drag-over, .week-card.drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  row.addEventListener("dragover", (e) => {
    if (!draggedWeekGoal) return;
    if (draggedWeekGoal.weekKey !== week.key) return;
    if (draggedWeekGoal.itemId === itemId) return;
    e.preventDefault();
    e.stopPropagation();
    row.classList.add("drag-over");
  });

  row.addEventListener("dragleave", () => row.classList.remove("drag-over"));

  row.addEventListener("drop", async (e) => {
    row.classList.remove("drag-over");
    if (!draggedWeekGoal) return;
    if (draggedWeekGoal.weekKey !== week.key) return;
    if (draggedWeekGoal.itemId === itemId) return;
    e.preventDefault();
    e.stopPropagation();
    const fromId = draggedWeekGoal.itemId;
    draggedWeekGoal = null;
    await reorderWeekGoals(week.key, fromId, itemId);
  });

  return row;
}

// 同一週內重新排序
async function reorderWeekGoals(weekKey, fromId, toId) {
  if (!currentUser) return;

  const items = weeklyGoalsData[weekKey]?.items || {};
  const sortedIds = getWeekGoalsSorted(items);
  const fromIndex = sortedIds.indexOf(fromId);
  const toIndex = sortedIds.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1) return;

  sortedIds.splice(fromIndex, 1);
  sortedIds.splice(toIndex, 0, fromId);

  const updates = {};
  sortedIds.forEach((id, index) => {
    updates[`users/${currentUser}/weeklyGoals/${weekKey}/items/${id}/order`] =
      index;
  });

  try {
    await update(ref(db), updates);
  } catch (error) {
    console.error("重新排序週目標失敗:", error);
  }
}

// 搬到另一週
async function moveWeekGoal(fromWeekKey, itemId, toWeekKey) {
  if (!currentUser || fromWeekKey === toWeekKey) return;

  const item = weeklyGoalsData[fromWeekKey]?.items?.[itemId];
  if (!item) return;

  const targetItems = weeklyGoalsData[toWeekKey]?.items || {};
  const maxOrder = Object.values(targetItems).reduce((max, target) => {
    return Math.max(max, target.order ?? 0);
  }, -1);

  const updates = {};
  updates[
    `users/${currentUser}/weeklyGoals/${toWeekKey}/items/${Date.now()}`
  ] = { ...item, order: maxOrder + 1 };
  updates[`users/${currentUser}/weeklyGoals/${fromWeekKey}/items/${itemId}`] =
    null;

  try {
    await update(ref(db), updates);
  } catch (error) {
    console.error("移動週目標失敗:", error);
    alert("移動失敗，請稍後再試");
  }
}

// 開啟週目標彈窗（沒帶 itemId 就是新增）
function openWeekGoalModal(week, itemId = null, item = null) {
  editingWeekGoal = { weekKey: week.key, itemId };
  weekGoalModalTitle.textContent = itemId ? "編輯週目標" : "新增週目標";
  weekGoalModalRange.textContent = `${formatWeekRange(week.start, week.end)} 這一週`;
  weekGoalInput.value = item?.text || "";
  selectedWeekGoalColor = item?.color || "blue";

  weekGoalColorPicker.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.toggle("selected", opt.dataset.color === selectedWeekGoalColor);
  });

  weekGoalModal.classList.remove("hidden");
  weekGoalInput.focus();
}

function closeWeekGoal() {
  weekGoalModal.classList.add("hidden");
  editingWeekGoal = null;
}

closeWeekGoalModal.addEventListener("click", closeWeekGoal);
weekGoalModal.addEventListener("click", (e) => {
  if (e.target === weekGoalModal) closeWeekGoal();
});

weekGoalColorPicker.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", (e) => {
    weekGoalColorPicker
      .querySelectorAll(".color-option")
      .forEach((o) => o.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedWeekGoalColor = e.target.dataset.color;
  });
});

async function saveWeekGoal() {
  if (!editingWeekGoal || !currentUser) return;

  const text = weekGoalInput.value.trim();
  if (!text) {
    alert("請輸入週目標");
    return;
  }

  const { weekKey, itemId } = editingWeekGoal;
  const items = weeklyGoalsData[weekKey]?.items || {};

  try {
    if (itemId) {
      const itemRef = ref(
        db,
        `users/${currentUser}/weeklyGoals/${weekKey}/items/${itemId}`
      );
      await update(itemRef, { text, color: selectedWeekGoalColor });
    } else {
      const maxOrder = Object.values(items).reduce((max, item) => {
        return Math.max(max, item.order ?? 0);
      }, -1);

      const newItemId = Date.now().toString();
      const itemRef = ref(
        db,
        `users/${currentUser}/weeklyGoals/${weekKey}/items/${newItemId}`
      );
      await set(itemRef, {
        text,
        completed: false,
        color: selectedWeekGoalColor,
        order: maxOrder + 1,
      });
    }

    closeWeekGoal();
  } catch (error) {
    console.error("儲存週目標失敗:", error);
    alert("儲存失敗，請稍後再試");
  }
}

saveWeekGoalBtn.addEventListener("click", saveWeekGoal);
weekGoalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") saveWeekGoal();
});

async function toggleWeekGoalItem(weekKey, itemId, completed) {
  if (!currentUser) return;

  try {
    const itemRef = ref(
      db,
      `users/${currentUser}/weeklyGoals/${weekKey}/items/${itemId}`
    );
    await update(itemRef, { completed });
  } catch (error) {
    console.error("更新週目標狀態失敗:", error);
  }
}

async function deleteWeekGoalItem(weekKey, itemId) {
  if (!currentUser) return;
  if (!confirm("確定要刪除此週目標嗎？")) return;

  try {
    const itemRef = ref(
      db,
      `users/${currentUser}/weeklyGoals/${weekKey}/items/${itemId}`
    );
    await set(itemRef, null);
  } catch (error) {
    console.error("刪除週目標失敗:", error);
    alert("刪除失敗，請稍後再試");
  }
}

// 週目標欄顯示／隱藏（記在本機）
function weekPanelStorageKey() {
  return `mycal_weekPanel_${currentUser}`;
}

function applyWeekPanelState(visible) {
  appBody.classList.toggle("week-hidden", !visible);
  weekPanelBtn.classList.toggle("active", visible);
  if (visible && isNarrowLayout()) appBody.classList.add("sidebar-hidden");
}

function setWeekPanelVisible(visible) {
  applyWeekPanelState(visible);
  try {
    localStorage.setItem(weekPanelStorageKey(), visible ? "1" : "0");
  } catch (error) {
    console.error("儲存週目標欄設定失敗:", error);
  }
}

function loadWeekPanelVisibility() {
  let saved = null;
  try {
    saved = localStorage.getItem(weekPanelStorageKey());
  } catch (error) {
    console.error("讀取週目標欄設定失敗:", error);
  }
  // 沒設定過時，寬螢幕才預設展開（窄螢幕塞不下三欄）
  applyWeekPanelState(saved === null ? window.innerWidth > 1100 : saved !== "0");
}

weekPanelBtn.addEventListener("click", () => {
  setWeekPanelVisible(appBody.classList.contains("week-hidden"));
});

closeWeekPanelBtn.addEventListener("click", () => setWeekPanelVisible(false));

// ==================== 刪除當月項目（依項目／星期） ====================

const deleteAllMonthItemsBtn = document.getElementById("deleteAllMonthItemsBtn");
const deleteScopeModal = document.getElementById("deleteScopeModal");
const closeDeleteScopeModal = document.getElementById("closeDeleteScopeModal");
const deleteScopeTitle = document.getElementById("deleteScopeTitle");
const deleteTargetSelect = document.getElementById("deleteTargetSelect");
const deletePresetGroup = document.getElementById("deletePresetGroup");
const deleteWeekdayPicker = document.getElementById("deleteWeekdayPicker");
const deleteScopePreview = document.getElementById("deleteScopePreview");
const confirmDeleteScopeBtn = document.getElementById("confirmDeleteScopeBtn");

const deleteScopePicker = createScopePicker(
  deletePresetGroup,
  deleteWeekdayPicker,
  renderDeleteScopePreview
);

// 蒐集當月出現過的項目名稱與次數
function collectMonthItemTexts() {
  const counts = new Map();
  forEachDayInScope(new Set(APPLY_PRESETS.all), (dateKey, items) => {
    Object.values(items).forEach((item) => {
      counts.set(item.text, (counts.get(item.text) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function renderDeleteScopePreview() {
  const target = deleteTargetSelect.value;
  let itemCount = 0;
  let dayCount = 0;

  forEachDayInScope(deleteScopePicker.days, (dateKey, items) => {
    const matched = Object.values(items).filter(
      (item) => !target || item.text === target
    );
    if (matched.length > 0) {
      dayCount++;
      itemCount += matched.length;
    }
  });

  deleteScopePreview.textContent =
    deleteScopePicker.days.size === 0
      ? "請至少選擇一個星期"
      : `將刪除 ${itemCount} 個項目（分布在 ${dayCount} 天）`;
  confirmDeleteScopeBtn.disabled = itemCount === 0;
}

deleteTargetSelect.addEventListener("change", renderDeleteScopePreview);

deleteAllMonthItemsBtn.addEventListener("click", () => {
  if (!currentUser) return;

  deleteScopeTitle.textContent = `刪除 ${currentYear} 年 ${
    currentMonth + 1
  } 月項目`;

  // 重建項目下拉選單
  deleteTargetSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "全部項目";
  deleteTargetSelect.appendChild(allOption);

  collectMonthItemTexts().forEach(([text, count]) => {
    const option = document.createElement("option");
    option.value = text;
    option.textContent = `${text}（${count}）`;
    deleteTargetSelect.appendChild(option);
  });

  deleteScopePicker.reset();
  deleteScopeModal.classList.remove("hidden");
});

function closeDeleteScope() {
  deleteScopeModal.classList.add("hidden");
}

closeDeleteScopeModal.addEventListener("click", closeDeleteScope);
deleteScopeModal.addEventListener("click", (e) => {
  if (e.target === deleteScopeModal) closeDeleteScope();
});

confirmDeleteScopeBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  const target = deleteTargetSelect.value;
  const updates = {};
  let itemCount = 0;

  forEachDayInScope(deleteScopePicker.days, (dateKey, items) => {
    Object.keys(items).forEach((itemId) => {
      if (target && items[itemId].text !== target) return;
      updates[`users/${currentUser}/dailyGoals/${dateKey}/items/${itemId}`] =
        null;
      itemCount++;
    });
  });

  if (itemCount === 0) return;

  const targetName = target ? `「${target}」` : "所有項目";
  const confirmDelete = confirm(
    `確定要刪除 ${currentYear} 年 ${
      currentMonth + 1
    } 月的 ${targetName} 共 ${itemCount} 個項目嗎？\n此操作無法復原！`
  );
  if (!confirmDelete) return;

  try {
    await update(ref(db), updates);
    closeDeleteScope();
    alert(`已刪除 ${itemCount} 個項目`);
  } catch (error) {
    console.error("刪除當月項目失敗:", error);
    alert("刪除失敗，請稍後再試");
  }
});

// ==================== 達成率計算 ====================

// 一個月的達成率：每個顏色主題各自挑要算的日子（每日／平日／假日），
// 該天只要有排上這個顏色的項目就算達成，不必勾完成。
// 整月未出現過的主題不列入計算，免得沒在用的顏色一直拖低分母。
// 主題可各自設起始日，起始日之前的日子不算分母（例如月中才開始的項目）。
function computeMonthProgress(dailyGoals, year, month, schedules, startDates) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const themes = COLOR_DEFS.map(({ key, hex }) => {
    const startDate = getColorStartDate(startDates, key);
    return {
      key,
      hex,
      schedule: getColorSchedule(schedules, key),
      startDate,
      // 這個月從第幾天開始算：起始日在本月就從那天起，之後的月份整月都算，
      // 起始日還沒到的月份則一天都不算
      firstDay: startDate
        ? startDate > getDateKey(year, month, daysInMonth)
          ? daysInMonth + 1
          : startDate < getDateKey(year, month, 1)
          ? 1
          : Number(startDate.slice(8))
        : 1,
      targetDays: 0,
      doneDays: 0,
      used: false,
    };
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = getDateKey(year, month, day);
    const items = dailyGoals?.[dateKey]?.items || {};
    const colorsToday = new Set(
      Object.values(items).map((item) => item.color || "blue")
    );
    const dayOfWeek = new Date(year, month, day).getDay();

    themes.forEach((theme) => {
      if (colorsToday.has(theme.key)) theme.used = true;
      if (day < theme.firstDay) return;
      if (!scheduleCoversDay(theme.schedule, dayOfWeek)) return;
      theme.targetDays++;
      if (colorsToday.has(theme.key)) theme.doneDays++;
    });
  }

  const counted = themes.filter(
    (theme) => theme.used && theme.schedule !== "off" && theme.targetDays > 0
  );
  const targetDays = counted.reduce((sum, t) => sum + t.targetDays, 0);
  const doneDays = counted.reduce((sum, t) => sum + t.doneDays, 0);
  const rate = targetDays > 0 ? Math.round((doneDays / targetDays) * 100) : null;

  return { themes, counted, targetDays, doneDays, rate };
}

function calculateProgressRate() {
  const today = getToday();
  const isCurrentMonth =
    currentYear === today.year && currentMonth === today.month;

  currentProgress = computeMonthProgress(
    dailyGoalsData,
    currentYear,
    currentMonth,
    colorSchedules,
    colorStartDates
  );
  const { counted, targetDays, doneDays } = currentProgress;
  const rate = currentProgress.rate ?? 0;

  progressRate.textContent = `${rate}%`;
  progressRateBig.textContent = `${rate}%`;
  progressDetail.textContent = counted.length
    ? `達成 ${doneDays} 天 / 應做 ${targetDays} 天（${counted.length} 個主題）`
    : "本月還沒有排任何項目";
  progressBarFill.style.width = `${rate}%`;
  renderProgressThemes();

  // 更新 Firebase 中的達成率
  if (currentUser && isCurrentMonth) {
    const monthKey = getMonthKey(currentYear, currentMonth);
    const monthGoalRef = ref(
      db,
      `users/${currentUser}/monthlyGoals/${monthKey}`
    );
    update(monthGoalRef, { progressRate: rate / 100 }).catch(console.error);
  }
}

// ==================== 達成率彈窗 ====================

function renderProgressThemes() {
  if (!currentProgress) return;

  progressThemeList.innerHTML = "";

  currentProgress.themes.forEach((theme) => {
    const row = document.createElement("div");
    row.className = "progress-theme";
    if (!theme.used) row.classList.add("unused");

    const dot = document.createElement("span");
    dot.className = "color-theme-dot";
    dot.style.background = theme.hex;

    const name = document.createElement("span");
    name.className = "progress-theme-name";
    name.textContent = getColorLabel(theme.key);

    const picker = document.createElement("div");
    picker.className = "schedule-picker";
    SCHEDULE_DEFS.forEach(({ key, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `schedule-btn${theme.schedule === key ? " active" : ""}`;
      btn.textContent = label;
      btn.addEventListener("click", () => saveColorSchedule(theme.key, key));
      picker.appendChild(btn);
    });

    const start = document.createElement("input");
    start.type = "date";
    start.className = "schedule-start";
    start.title = "起始日期：這天之前不列入計算";
    start.value = theme.startDate;
    start.addEventListener("change", () =>
      saveColorStartDate(theme.key, start.value)
    );

    const stat = document.createElement("span");
    stat.className = "progress-theme-stat";
    if (!theme.used) {
      stat.textContent = "本月未使用";
    } else if (theme.schedule === "off") {
      stat.textContent = "—";
    } else if (theme.targetDays === 0) {
      stat.textContent = "尚未開始";
    } else {
      const rate = Math.round((theme.doneDays / theme.targetDays) * 100);
      stat.textContent = `${theme.doneDays}/${theme.targetDays}　${rate}%`;
    }

    const bar = document.createElement("div");
    bar.className = "progress-bar progress-theme-bar";
    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.background = theme.hex;
    fill.style.width =
      theme.used && theme.schedule !== "off" && theme.targetDays > 0
        ? `${Math.round((theme.doneDays / theme.targetDays) * 100)}%`
        : "0";
    bar.appendChild(fill);

    row.append(dot, name, stat, picker, start, bar);
    progressThemeList.appendChild(row);
  });
}

progressNavBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  closeNavPanels();
  progressTitle.textContent = `📊 ${currentMonth + 1} 月達成率`;
  calculateProgressRate();
  progressModal.classList.remove("hidden");
});

closeProgressModal.addEventListener("click", () => {
  progressModal.classList.add("hidden");
});

progressModal.addEventListener("click", (e) => {
  if (e.target === progressModal) progressModal.classList.add("hidden");
});

// ==================== 即時監聽 ====================

function setupRealtimeListeners() {
  if (!currentUser) return;

  // 監聽每日目標變化
  const dailyGoalsRef = ref(db, `users/${currentUser}/dailyGoals`);
  onValue(dailyGoalsRef, (snapshot) => {
    if (snapshot.exists()) {
      dailyGoalsData = snapshot.val();
    } else {
      dailyGoalsData = {};
    }
    updateCalendarStatus();

    // 若彈窗已開啟，即時更新項目列表
    if (selectedDate && !dailyModal.classList.contains("hidden")) {
      renderItemsList();
    }
  });

  // 監聽各顏色的達成率計算範圍
  const colorSchedulesRef = ref(db, `users/${currentUser}/colorSchedules`);
  onValue(colorSchedulesRef, (snapshot) => {
    colorSchedules = snapshot.exists() ? snapshot.val() : {};
    calculateProgressRate();
  });

  // 監聽各顏色的起始日期
  const colorStartDatesRef = ref(db, `users/${currentUser}/colorStartDates`);
  onValue(colorStartDatesRef, (snapshot) => {
    colorStartDates = snapshot.exists() ? snapshot.val() : {};
    calculateProgressRate();
  });

  // 監聽顏色主題變化
  const colorThemesRef = ref(db, `users/${currentUser}/colorThemes`);
  onValue(colorThemesRef, (snapshot) => {
    colorThemeNames = snapshot.exists() ? snapshot.val() : {};
    renderColorThemes();
    renderProgressThemes();
    refreshColorPickerLabels();
  });

  // 監聽週目標變化
  const weeklyGoalsRef = ref(db, `users/${currentUser}/weeklyGoals`);
  onValue(weeklyGoalsRef, (snapshot) => {
    weeklyGoalsData = snapshot.exists() ? snapshot.val() : {};
    renderWeekGoals();
  });
}

// ==================== 統計總覽功能 ====================

const viewStatsBtn = document.getElementById("viewStatsBtn");
const statsModal = document.getElementById("statsModal");
const closeStatsModal = document.getElementById("closeStatsModal");
const statsContent = document.getElementById("statsContent");
const statsGridViewBtn = document.getElementById("statsGridViewBtn");
const statsChartViewBtn = document.getElementById("statsChartViewBtn");

// 使用者顏色對應
const userColors = ["#3498DB", "#E74C3C", "#2ECC71", "#F1C40F", "#9B59B6", "#E91E63", "#1ABC9C", "#E67E22"];

// 統計資料快取
let cachedStatsData = null;
let currentStatsView = "grid"; // "grid" or "chart"

// 開啟統計彈窗
viewStatsBtn.addEventListener("click", async () => {
  statsModal.classList.remove("hidden");
  const statsTitle = document.getElementById("statsTitle");
  if (statsTitle) statsTitle.textContent = `📊 ${currentYear} 年統計總覽`;
  statsContent.innerHTML = '<p class="loading-text">載入中...</p>';
  cachedStatsData = null;
  await loadAllUsersStats();
});

// 關閉統計彈窗
closeStatsModal.addEventListener("click", () => {
  statsModal.classList.add("hidden");
});

statsModal.addEventListener("click", (e) => {
  if (e.target === statsModal) {
    statsModal.classList.add("hidden");
  }
});

// 切換視圖按鈕
statsGridViewBtn.addEventListener("click", () => {
  if (currentStatsView === "grid") return;
  currentStatsView = "grid";
  statsGridViewBtn.classList.add("active");
  statsChartViewBtn.classList.remove("active");
  renderStatsView();
});

statsChartViewBtn.addEventListener("click", () => {
  if (currentStatsView === "chart") return;
  currentStatsView = "chart";
  statsChartViewBtn.classList.add("active");
  statsGridViewBtn.classList.remove("active");
  renderStatsView();
});

// 載入所有使用者的統計資料
async function loadAllUsersStats() {
  try {
    // 取得所有白名單使用者
    const whitelistRef = ref(db, "loginWhitelist");
    const whitelistSnapshot = await get(whitelistRef);

    if (!whitelistSnapshot.exists()) {
      statsContent.innerHTML = '<p class="loading-text">沒有使用者資料</p>';
      return;
    }

    const users = Object.keys(whitelistSnapshot.val());
    cachedStatsData = [];

    for (let i = 0; i < users.length; i++) {
      const phone = users[i];
      const userColor = userColors[i % userColors.length];

      // 取得該使用者目前年份的資料
      const monthlyRates = await getUserMonthlyRates(phone, currentYear);
      const yearGoals = await getUserYearGoals(phone, currentYear);

      cachedStatsData.push({
        phone,
        color: userColor,
        monthlyRates,
        yearGoals
      });
    }

    renderStatsView();
  } catch (error) {
    console.error("載入統計資料失敗:", error);
    statsContent.innerHTML = '<p class="loading-text">載入失敗，請稍後再試</p>';
  }
}

// 根據當前視圖模式渲染統計內容
function renderStatsView() {
  if (!cachedStatsData || cachedStatsData.length === 0) {
    statsContent.innerHTML = '<p class="loading-text">沒有使用者資料</p>';
    return;
  }

  let html = "";

  if (currentStatsView === "grid") {
    cachedStatsData.forEach((userData) => {
      html += renderUserStatsSection(userData.phone, userData.color, userData.monthlyRates, userData.yearGoals);
    });
  } else {
    cachedStatsData.forEach((userData) => {
      html += renderUserChartSection(userData.phone, userData.color, userData.monthlyRates, userData.yearGoals);
    });
  }

  statsContent.innerHTML = html;
}

// 取得使用者各月達成率（與本月達成率相同邏輯）
async function getUserMonthlyRates(phone, year) {
  let dailyGoals = {};
  let schedules = {};
  let startDates = {};

  try {
    const [dailySnap, scheduleSnap, startSnap] = await Promise.all([
      get(ref(db, `users/${phone}/dailyGoals`)),
      get(ref(db, `users/${phone}/colorSchedules`)),
      get(ref(db, `users/${phone}/colorStartDates`)),
    ]);
    if (dailySnap.exists()) dailyGoals = dailySnap.val();
    if (scheduleSnap.exists()) schedules = scheduleSnap.val();
    if (startSnap.exists()) startDates = startSnap.val();
  } catch (error) {
    console.error("讀取達成率資料失敗:", error);
    return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, rate: null }));
  }

  const rates = [];
  for (let month = 0; month < 12; month++) {
    const { rate } = computeMonthProgress(
      dailyGoals,
      year,
      month,
      schedules,
      startDates
    );
    rates.push({ month: month + 1, rate });
  }

  return rates;
}

// 取得使用者年度目標
async function getUserYearGoals(phone, year) {
  try {
    const yearGoalsRef = ref(db, `users/${phone}/yearlyGoals/${year}/items`);
    const snapshot = await get(yearGoalsRef);

    if (snapshot.exists()) {
      const goals = snapshot.val();
      return Object.values(goals).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }
    return [];
  } catch (error) {
    return [];
  }
}

// 渲染單一使用者的統計區塊
function renderUserStatsSection(phone, color, monthlyRates, yearGoals) {
  // 月達成率 HTML
  let monthsHtml = "";
  monthlyRates.forEach((m) => {
    const rateClass = m.rate === null ? "none" : m.rate >= 70 ? "high" : m.rate >= 40 ? "medium" : "low";
    const rateText = m.rate === null ? "--" : `${m.rate}%`;
    monthsHtml += `
      <div class="stats-month">
        <div class="stats-month-label">${m.month}月</div>
        <div class="stats-month-rate ${rateClass}">${rateText}</div>
      </div>
    `;
  });

  // 年度目標 HTML
  let goalsHtml = "";
  if (yearGoals.length > 0) {
    yearGoals.forEach((goal) => {
      const statusClass = goal.completed ? "completed" : "pending";
      const statusIcon = goal.completed ? "✓" : "";
      const textClass = goal.completed ? "completed" : "";
      goalsHtml += `
        <div class="stats-goal-item">
          <span class="goal-status ${statusClass}">${statusIcon}</span>
          <span class="goal-text ${textClass}">${goal.text}</span>
        </div>
      `;
    });
  } else {
    goalsHtml = '<p class="stats-no-goals">尚未設定年度目標</p>';
  }

  return `
    <div class="stats-user-section">
      <div class="stats-user-header">
        <div class="stats-user-avatar" style="background-color: ${color}">👤</div>
        <span class="stats-user-name">${phone}</span>
      </div>
      <div class="stats-months">${monthsHtml}</div>
      <div class="stats-year-goals">
        <div class="stats-year-goals-title">🎯 年度目標</div>
        ${goalsHtml}
      </div>
    </div>
  `;
}

// 渲染單一使用者的圖表區塊
function renderUserChartSection(phone, color, monthlyRates, yearGoals) {
  // 長條圖 HTML
  let barsHtml = "";
  monthlyRates.forEach((m) => {
    const rate = m.rate ?? 0;
    const heightPercent = m.rate === null ? 3 : Math.max(rate, 3); // 最小高度 3%
    const rateClass = m.rate === null ? "none" : rate >= 70 ? "high" : rate >= 40 ? "medium" : "low";
    const tooltipText = m.rate === null ? "無資料" : `${m.rate}%`;

    barsHtml += `
      <div class="stats-bar-wrapper">
        <div class="stats-bar ${rateClass}" style="height: ${heightPercent}%">
          <span class="stats-bar-tooltip">${tooltipText}</span>
          <span class="stats-bar-label">${m.month}月</span>
        </div>
      </div>
    `;
  });

  // 年度目標 HTML
  let goalsHtml = "";
  if (yearGoals.length > 0) {
    yearGoals.forEach((goal) => {
      const statusClass = goal.completed ? "completed" : "pending";
      const statusIcon = goal.completed ? "✓" : "";
      const textClass = goal.completed ? "completed" : "";
      goalsHtml += `
        <div class="stats-goal-item">
          <span class="goal-status ${statusClass}">${statusIcon}</span>
          <span class="goal-text ${textClass}">${goal.text}</span>
        </div>
      `;
    });
  } else {
    goalsHtml = '<p class="stats-no-goals">尚未設定年度目標</p>';
  }

  return `
    <div class="stats-chart-section">
      <div class="stats-chart-header">
        <div class="stats-chart-avatar" style="background-color: ${color}">👤</div>
        <span class="stats-chart-name">${phone}</span>
      </div>
      <div class="stats-chart-container">
        <div class="stats-chart">
          <div class="stats-chart-y-axis">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <div class="stats-chart-bars">
            <div class="stats-chart-grid">
              <div class="stats-chart-grid-line"></div>
              <div class="stats-chart-grid-line"></div>
              <div class="stats-chart-grid-line"></div>
              <div class="stats-chart-grid-line"></div>
              <div class="stats-chart-grid-line"></div>
            </div>
            ${barsHtml}
          </div>
        </div>
      </div>
      <div class="stats-chart-goals">
        <div class="stats-year-goals-title">🎯 年度目標</div>
        ${goalsHtml}
      </div>
    </div>
  `;
}

// ==================== 初始化 ====================

// 網站載入時先檢查/建立白名單，再檢查登入狀態
initWhitelist().then(() => {
  checkLogin();
});
