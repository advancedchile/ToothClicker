// Tooth Clicker — Shared utilities, constants, and state helpers
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SAVES_KEY        = 'tooth-clicker-saves-v2';
const CURRENT_USER_KEY = 'tooth-clicker-current-user';
const LANG_KEY         = 'tooth-clicker-lang';
const SOUND_KEY        = 'tooth-clicker-sound';
const NUMFMT_KEY       = 'tooth-clicker-numfmt';
const USERS_KEY        = 'tooth-clicker-users';
const DEVICE_USER_KEY  = 'tooth-clicker-device-user';
const ADMIN_USERS_KEY  = 'tooth-clicker-admin-users';
const LB_RESET_KEY     = 'tooth-clicker-lb-reset-v3';
const LAST_RESET_KEY   = 'tooth-clicker-last-reset-v1';
const ADMIN_AUTH_KEY   = 'tooth-clicker-admin-session-v1';
const ADMIN_NAME       = 'James'; // reserved superuser name

let MUSIC_TRACKS = [
  { id: '1', title: 'Cartucho Azul', src: 'assets/music/Cartucho_Azul.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '2', title: 'Cartucho Azul 2', src: 'assets/music/Cartucho_Azul_2.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '3', title: 'Respira en 8 Bits 1', src: 'assets/music/Respira_en_8_Bits_1.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' },
  { id: '4', title: 'Respira en 8 Bits 2', src: 'assets/music/Respira_en_8_Bits_2.mp3', cover: 'https://img.icons8.com/color/96/music-record.png' }
];

function formatMusicTime(secs) {
  if (isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatTime(secs) {
  if (isNaN(secs)) return "0 min";
  const minsTotal = Math.floor(secs / 60);
  const lang = window.__lang || 'es';
  
  if (minsTotal < 60) {
    return `${minsTotal} min`;
  } else {
    const hours = Math.floor(minsTotal / 60);
    const mins = minsTotal % 60;
    if (lang === 'es') {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}${mins > 0 ? ` ${mins} min` : ''}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}${mins > 0 ? ` ${mins} min` : ''}`;
    }
  }
}

window.playClickSound = () => {
  if (window.playTone) {
    window.playTone(880, 0.05, 'sine', 0.05);
  }
};

function loadAllSaves() {try {return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}') || {};} catch (e) {return {};}}
function saveAllSaves(o) {try {localStorage.setItem(SAVES_KEY, JSON.stringify(o));} catch (e) {}}
function loadUserSave(u) {if (!u) return null;return loadAllSaves()[u] || null;}
function persistUserSave(u, s) {if (!u) return;const all = loadAllSaves();all[u] = s;saveAllSaves(all);}
function deleteUserSave(u) {const all = loadAllSaves();delete all[u];saveAllSaves(all);}

function loadUsers() {try {return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') || [];} catch (e) {return [];}}
function saveUsers(a) {try {localStorage.setItem(USERS_KEY, JSON.stringify(a));} catch (e) {}}

// Unified leaderboard reset logic
function resetAllProgress() {
  localStorage.removeItem(SAVES_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(DEVICE_USER_KEY);
  window.cloudResetAll && window.cloudResetAll();
}

function defaultState() {
  return { teeth: 0, totalEarned: 0, totalClicks: 0, goldenClicks: 0, generators: {}, clickUpgrades: {}, achievements: {}, newAchievementIds: {}, storeUpgrades: {}, prestige: 0, prestigeCount: 0, selectedTooth: 0, startedAt: Date.now(), timePlayed: 0, lastTick: Date.now(), feedbackSent: false, feedbackCount: 0, dontShowTourAgain: false, hasSeenTour: false, hasSeenHelpIndicator: false, clinicName: null, level: 0, xp: 0, xpUpgrades: {}, musicSettings: { volume: 0.4, muted: false, playMode: 'shuffle', currentTrackId: null } };
}

window.getXPRequired = function(level) {
  if (level <= 0) return 100;
  let req = 100;
  // Mult starts at 1.75 and grows by 0.5 per level
  for (let i = 0; i < level; i++) {
    req *= (1.75 + (i * 0.5));
    if (req > 1e307) return 1e308; // Infinity safety
  }
  return Math.floor(req);
};

// Shared button styles
const topBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-s)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', background: 'var(--bg-1)', fontFamily: 'var(--font-sans)' };
const primaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--primary-i100)', color: '#fff', borderRadius: 'var(--radius-s)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const secondaryBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '10px 18px', background: 'var(--bg-3)', color: 'var(--fg-1)', borderRadius: 'var(--radius-s)', fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)' };
const debugBtnStyle = { all: 'unset', boxSizing: 'border-box', padding: '4px 8px', fontSize: 10, fontWeight: 700, background: 'var(--bg-2)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-2)', transition: 'all 100ms' };

// Global exports
Object.assign(window, { 
  formatMusicTime, formatTime, 
  loadAllSaves, saveAllSaves, loadUserSave, persistUserSave, deleteUserSave, 
  loadUsers, saveUsers, resetAllProgress, defaultState, 
  topBtnStyle, primaryBtnStyle, secondaryBtnStyle, debugBtnStyle,
  SAVES_KEY, CURRENT_USER_KEY, LANG_KEY, SOUND_KEY, NUMFMT_KEY, USERS_KEY, DEVICE_USER_KEY, ADMIN_USERS_KEY, LAST_RESET_KEY, ADMIN_AUTH_KEY, ADMIN_NAME, MUSIC_TRACKS
});

