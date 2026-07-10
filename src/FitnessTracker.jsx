import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";

/* ============================================================
   DESIGN TOKENS
   Dark premium base + vivid, purposeful accent colors per role
   (not just one blue) — energetic but disciplined.
============================================================ */
const C = {
  bg: "#08090c",
  bgGrad: "linear-gradient(180deg,#0c0e14 0%,#08090c 60%)",
  surface: "#12141c",
  surface2: "#191c26",
  border: "#242836",
  borderSoft: "#1c1f2a",
  text: "#f3f5fb",
  sub: "#7c88a6",
  subDim: "#4c5876",
  blue: "#3e8bff",
  cyan: "#22d3ee",
  orange: "#ff8a3d",
  pink: "#fb5aa0",
  purple: "#a06bff",
  green: "#31d68a",
  yellow: "#ffc93d",
  red: "#ff5c5c",
};

const MUSCLE_COLORS = {
  Chest: C.blue, Back: C.purple, Shoulders: C.orange, Biceps: C.green,
  Triceps: C.red, Quads: C.cyan, Hamstrings: C.orange, Glutes: C.pink,
  Core: "#9ade4a", Calves: C.purple, "Rear Delts": "#14c9b8", "Upper Back": "#8b5cf6",
  "Front Delts": C.pink, Traps: "#9aa3bd", "Full Body": C.blue,
};
function getColor(muscle) {
  for (const [k, v] of Object.entries(MUSCLE_COLORS)) if (muscle.startsWith(k)) return v;
  return C.blue;
}

const PLANS = [
  {
    id: 0, key: "upper1", label: "Day 1", name: "Upper 1", focus: "Pull-Emphasis", icon: "🎯", accent: C.purple,
    muscles: "Back · Chest · Biceps",
    exercises: [
      { name: "Pullups", muscle: "Back", restSec: 120, defaultSets: [{ w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }] },
      { name: "One-Arm DB Row", muscle: "Back", restSec: 120, defaultSets: [{ w: 40, r: "8-12" }, { w: 40, r: "8-12" }, { w: 40, r: "8-12" }] },
      { name: "Chest-Supported Incline Row", muscle: "Upper Back", restSec: 120, defaultSets: [{ w: 35, r: "10-12" }, { w: 35, r: "10-12" }, { w: 35, r: "10-12" }] },
      { name: "Neutral-Grip DB Bench Press", muscle: "Chest", wrist: true, note: "Neutral grip — wrist protected", restSec: 120, defaultSets: [{ w: 35, r: "8-10" }, { w: 35, r: "8-10" }, { w: 35, r: "8-10" }] },
      { name: "Flat DB Flyes", muscle: "Chest", restSec: 90, defaultSets: [{ w: 20, r: "12-15" }, { w: 20, r: "12-15" }, { w: 20, r: "12-15" }] },
      { name: "DB Hammer Curl", muscle: "Biceps", restSec: 90, defaultSets: [{ w: 25, r: "10-12" }, { w: 25, r: "10-12" }, { w: 25, r: "10-12" }] },
    ],
    warmup: ["5 min light cardio", "Arm circles × 15 each direction", "Dead hang 20s × 2", "Band pull-aparts × 15", "Wrist mobility — your morning rehab already covers this"],
    cooldown: ["Lat stretch (hang or doorway) 30s", "Chest doorway stretch 30s × 2", "Bicep wall stretch 30s/side", "Child's pose 45s"],
  },
  {
    id: 1, key: "lower1", label: "Day 2", name: "Lower 1", focus: "Hamstring Focus", icon: "🔥", accent: C.orange,
    muscles: "Hamstrings · Glutes · Calves",
    exercises: [
      { name: "Romanian Deadlift", muscle: "Hamstrings", restSec: 120, defaultSets: [{ w: 45, r: "10-12" }, { w: 45, r: "10-12" }, { w: 45, r: "10-12" }, { w: 45, r: "10-12" }] },
      { name: "Bulgarian Split Squat", muscle: "Glutes/Quads", note: "Dumbbells at sides — wrist neutral", restSec: 120, defaultSets: [{ w: 30, r: "8-10" }, { w: 30, r: "8-10" }, { w: 30, r: "8-10" }] },
      { name: "Single-Leg RDL", muscle: "Hamstrings/Glutes", restSec: 120, defaultSets: [{ w: 30, r: "8-10" }, { w: 30, r: "8-10" }, { w: 30, r: "8-10" }] },
      { name: "Single-Leg Calf Raise", muscle: "Calves", restSec: 90, defaultSets: [{ w: 50, r: 15 }, { w: 50, r: 15 }, { w: 50, r: 15 }] },
      { name: "Band Face Pull", muscle: "Rear Delts (bonus)", restSec: 90, defaultSets: [{ w: "Band", r: "15-20" }, { w: "Band", r: "15-20" }, { w: "Band", r: "15-20" }] },
    ],
    warmup: ["5 min light cardio or brisk walk", "Hip hinge bodyweight × 10 (own RDL)", "Leg swings front/back × 10/side", "Glute bridges × 15"],
    cooldown: ["Seated hamstring stretch 45s", "Hip flexor lunge stretch 30s/side", "Glute figure-4 stretch 30s/side", "Calf wall stretch 30s/side"],
  },
  {
    id: 2, key: "upper2", label: "Day 3", name: "Upper 2", focus: "Push-Emphasis", icon: "💥", accent: C.blue,
    muscles: "Chest · Shoulders · Triceps",
    exercises: [
      { name: "Neutral-Grip Pullups", muscle: "Back", wrist: true, note: "Neutral grip — wrist protected", restSec: 120, defaultSets: [{ w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }, { w: "BW", r: "6-10" }] },
      { name: "Neutral-Grip DB Incline Press", muscle: "Chest", wrist: true, note: "Neutral grip — wrist protected", restSec: 120, defaultSets: [{ w: 35, r: "8-10" }, { w: 35, r: "8-10" }, { w: 35, r: "8-10" }] },
      { name: "DB Shoulder Press (Neutral)", muscle: "Shoulders", wrist: true, note: "Neutral grip — wrist protected", restSec: 120, defaultSets: [{ w: 25, r: "8-10" }, { w: 25, r: "8-10" }, { w: 25, r: "8-10" }] },
      { name: "Chest-Supported Incline Row", muscle: "Upper Back", restSec: 120, defaultSets: [{ w: 35, r: "10-12" }, { w: 35, r: "10-12" }, { w: 35, r: "10-12" }] },
      { name: "Overhead Tricep Extension", muscle: "Triceps", restSec: 90, defaultSets: [{ w: 20, r: "10-12" }, { w: 20, r: "10-12" }, { w: 20, r: "10-12" }] },
      { name: "DB Lateral Raise", muscle: "Shoulders (bonus)", restSec: 90, defaultSets: [{ w: 15, r: "12-15" }, { w: 15, r: "12-15" }, { w: 15, r: "12-15" }] },
    ],
    warmup: ["5 min light cardio (jumping jacks / high knees)", "Arm circles × 15 each direction", "Band pull-aparts × 15", "Wrist mobility — your morning rehab already covers this"],
    cooldown: ["Chest doorway stretch 30s × 2", "Shoulder cross-body stretch 30s/side", "Tricep overhead stretch 30s/side", "Child's pose 45s"],
  },
  {
    id: 3, key: "lower2", label: "Day 4", name: "Lower 2", focus: "Quad Focus", icon: "🦵", accent: C.cyan,
    muscles: "Quads · Glutes · Calves",
    exercises: [
      { name: "Weighted Vest RDL", muscle: "Hamstrings/Glutes", restSec: 120, defaultSets: [{ w: "Vest", r: "8-10" }, { w: "Vest", r: "8-10" }, { w: "Vest", r: "8-10" }, { w: "Vest", r: "8-10" }] },
      { name: "DB Reverse Lunge", muscle: "Glutes/Quads", restSec: 120, defaultSets: [{ w: 30, r: "10-12" }, { w: 30, r: "10-12" }, { w: 30, r: "10-12" }] },
      { name: "DB Step-Up", muscle: "Quads/Glutes", restSec: 120, defaultSets: [{ w: 25, r: "10-12" }, { w: 25, r: "10-12" }, { w: 25, r: "10-12" }] },
      { name: "DB Hip Thrust", muscle: "Glutes", restSec: 120, defaultSets: [{ w: 45, r: "10-12" }, { w: 45, r: "10-12" }, { w: 45, r: "10-12" }] },
      { name: "Single-Leg Calf Raise", muscle: "Calves", restSec: 90, defaultSets: [{ w: 50, r: 15 }, { w: 50, r: 15 }, { w: 50, r: 15 }] },
    ],
    warmup: ["5 min light cardio or brisk walk", "Leg swings front/back × 10/side", "Hip circles × 10", "Bodyweight squats × 15 (slow)"],
    cooldown: ["Standing quad stretch 30s/side", "Hip flexor lunge stretch 30s/side", "Seated hamstring stretch 45s", "Glute figure-4 stretch 30s/side"],
  },
];

const EXTRA_EXERCISES = [
  { name: "DB Shrug", muscle: "Traps" },
  { name: "Concentration Curl", muscle: "Biceps" },
  { name: "Tricep Kickback", muscle: "Triceps" },
  { name: "DB Lunge", muscle: "Quads" },
  { name: "Dead Hang", muscle: "Grip/Shoulder" },
  { name: "Side Plank", muscle: "Core" },
  { name: "DB Upright Row", muscle: "Traps/Shoulders" },
  { name: "Face Pull (DB)", muscle: "Rear Delts" },
];

const REST_OPTIONS = [60, 90, 120, 180];

/* ============================================================
   STYLES
============================================================ */
const S = {
  app: { background: C.bgGrad, minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", fontFamily: "'Barlow',sans-serif", color: C.text, position: "relative" },
  heroBar: { background: "linear-gradient(135deg,#151a28 0%,#0e111a 100%)", borderBottom: `1px solid ${C.border}`, padding: "14px 16px 12px" },
  goalLine: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", background: `linear-gradient(90deg,${C.blue},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 3 },
  h1: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1, color: C.text },
  subtitle: { fontSize: 11.5, color: C.sub, marginTop: 4, display: "flex", alignItems: "center", gap: 6 },
  screen: { flex: 1, overflowY: "auto", paddingBottom: 84 },
  page: { padding: 14 },
  secHdr: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12.5, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: C.subDim, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 6 },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 4 },
  statCard: (glow) => ({ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 8px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: `0 0 0 1px rgba(255,255,255,0.01), 0 8px 20px -12px ${glow}` }),
  statIconWrap: (bg) => ({ width: 30, height: 30, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 15 }),
  statVal: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1 },
  statLbl: { fontSize: 9.5, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginTop: 3, fontWeight: 700 },

  dayGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 4 },
  dayBtn: (accent) => ({ background: `linear-gradient(155deg, ${accent}22 0%, ${C.surface} 55%)`, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 13px", cursor: "pointer", textAlign: "left", position: "relative" }),
  dayIcon: { fontSize: 20, marginBottom: 6, display: "block" },
  dayTag: (accent) => ({ fontSize: 10, color: accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }),
  dayName: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: C.text, marginTop: 2 },
  dayMuscles: { fontSize: 10.5, color: C.sub, marginTop: 3 },

  prCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" },
  prRow: { display: "flex", alignItems: "center", padding: "12px 13px", borderBottom: `1px solid ${C.borderSoft}` },
  prTrophy: { width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#ffd35a,#ff9d3d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 10, flexShrink: 0, boxShadow: "0 4px 10px -4px rgba(255,157,61,0.6)" },
  prName: { flex: 1, fontWeight: 600, fontSize: 13 },
  prVal: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: C.yellow, textAlign: "right" },
  prDate: { fontSize: 10, color: C.sub, textAlign: "right", marginTop: 1 },

  wHdr: { background: "rgba(10,12,18,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  wTitle: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800 },
  timer: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.cyan },

  warmCard: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 13 },
  warmHdr: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: C.subDim, marginBottom: 9, display: "flex", alignItems: "center", gap: 6 },
  warmItem: { fontSize: 13, color: "#d5dbf0", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: 8 },

  restSelectWrap: { display: "flex", gap: 7, marginBottom: 13 },
  restChip: (active) => ({ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10, fontSize: 12.5, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 0.5, cursor: "pointer", background: active ? `linear-gradient(135deg,${C.blue},${C.cyan})` : C.surface, color: active ? "#fff" : C.sub, border: `1px solid ${active ? "transparent" : C.border}` }),

  exCard: (accent) => ({ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 13, overflow: "hidden", borderLeft: `3px solid ${accent}` }),
  exHdr: { padding: "12px 13px", borderBottom: `1px solid ${C.borderSoft}` },
  exNameRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  exName: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 800, lineHeight: 1.15 },
  exMuscle: { fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 },
  exBestBadge: { fontSize: 11, fontWeight: 800, color: C.yellow, background: "rgba(255,201,61,0.1)", border: "1px solid rgba(255,201,61,0.35)", borderRadius: 8, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 },
  wristBadge: { display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,138,61,0.12)", border: `1px solid ${C.orange}55`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: C.orange, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 6 },
  prevRow: { fontSize: 11, color: C.subDim, padding: "8px 13px 0", display: "flex", gap: 10, flexWrap: "wrap" },

  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 10, color: C.subDim, textTransform: "uppercase", letterSpacing: 1, padding: "8px 10px", borderBottom: `1px solid ${C.borderSoft}`, textAlign: "left", background: "rgba(255,255,255,0.015)" },
  td: { padding: "7px 9px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 13, verticalAlign: "middle" },
  input: { background: "#0b0e16", border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, textAlign: "center", width: 52, padding: "6px 3px" },
  checkBtn: (done) => ({ background: done ? `linear-gradient(135deg,${C.green},#1fae6f)` : "transparent", border: done ? "none" : `2px solid ${C.border}`, borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: done ? "#fff" : C.sub, boxShadow: done ? "0 3px 10px -4px rgba(49,214,138,0.7)" : "none" }),
  addSetBtn: { display: "block", width: "100%", padding: 10, background: "transparent", border: "none", borderTop: `1px solid ${C.borderSoft}`, color: C.blue, fontSize: 12, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", textAlign: "center" },
  addExBtn: { width: "100%", padding: 13, background: C.surface, border: `1.5px dashed ${C.border}`, borderRadius: 14, color: C.cyan, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginBottom: 13 },

  actionBar: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, marginBottom: 8 },
  btnFinish: { background: `linear-gradient(135deg,${C.green},#1fae6f)`, border: "none", borderRadius: 12, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 1, padding: 15, cursor: "pointer", textTransform: "uppercase", boxShadow: "0 8px 20px -8px rgba(49,214,138,0.5)" },
  btnDiscard: { background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 1, padding: 15, cursor: "pointer", textTransform: "uppercase" },

  histItem: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 11, cursor: "pointer" },
  histTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  histName: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 800 },
  histDate: { fontSize: 11, color: C.sub },
  histMeta: { display: "flex", gap: 13, fontSize: 12, color: C.sub, marginBottom: 10, fontWeight: 600 },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  pill: (isPR) => ({ background: isPR ? "rgba(255,201,61,0.12)" : C.surface2, border: isPR ? `1px solid ${C.yellow}88` : `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 11, color: isPR ? C.yellow : C.sub, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }),

  chartCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 14 },
  chartHdr: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: C.subDim, marginBottom: 12 },
  barRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 9 },
  barLabel: { fontSize: 11, color: C.sub, width: 78, flexShrink: 0, fontWeight: 600 },
  barTrack: { flex: 1, background: C.surface2, borderRadius: 5, height: 19, overflow: "hidden" },
  sparkCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 11 },
  sparkHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sparkName: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800 },
  sparkPR: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 800, color: C.yellow },

  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(9,10,15,0.95)", backdropFilter: "blur(10px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 },
  navBtn: (active, accent) => ({ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: active ? accent : C.sub, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }),

  sheetOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 200 },
  sheet: { position: "fixed", bottom: 68, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "18px 18px 0 0", zIndex: 210, padding: 15, maxHeight: "78vh", overflowY: "auto" },
  sheetHdr: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: C.subDim, marginBottom: 10, display: "flex", justifyContent: "space-between" },
  exOpt: { padding: "11px 10px", borderBottom: `1px solid ${C.borderSoft}`, cursor: "pointer", borderRadius: 8 },
  emptyBox: { textAlign: "center", padding: "46px 20px", color: C.sub },
  noWorkoutBtn: { background: `linear-gradient(135deg,${C.blue},${C.cyan})`, border: "none", borderRadius: 12, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 1, padding: "14px 28px", cursor: "pointer", textTransform: "uppercase", marginTop: 14 },

  /* Rest timer bar */
  restBar: { position: "fixed", bottom: 68, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "linear-gradient(135deg,#1a1030,#241238)", borderTop: `1px solid ${C.purple}55`, boxShadow: "0 -8px 24px -8px rgba(160,107,255,0.35)", zIndex: 150, padding: "10px 14px 12px" },
  restTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  restLabel: { fontSize: 11, color: "#c9b6ff", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2 },
  restTime: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1 },
  restTrack: { height: 6, borderRadius: 4, background: "rgba(255,255,255,0.12)", overflow: "hidden", marginBottom: 10 },
  restControls: { display: "flex", gap: 8, alignItems: "center" },
  restBtn: { flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 800, padding: "9px 0", cursor: "pointer", textAlign: "center" },
  restBtnMain: { flex: 1.4, background: "linear-gradient(135deg,#a06bff,#7c4ff0)", border: "none", borderRadius: 9, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 800, padding: "9px 0", cursor: "pointer", textAlign: "center" },

  /* History detail modal */
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { width: "100%", maxWidth: 430, background: C.surface, borderRadius: "20px 20px 0 0", maxHeight: "88vh", overflowY: "auto", padding: 18, border: `1px solid ${C.border}` },
  modalHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  modalTitle: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 900 },
  modalClose: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, width: 30, height: 30, color: C.sub, cursor: "pointer", fontSize: 14 },
  modalStatGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 },
  modalStatCard: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 6px", textAlign: "center" },
  modalStatVal: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.text },
  modalStatLbl: { fontSize: 9, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  modalExBlock: { marginBottom: 14, background: C.surface2, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" },
  modalExHdr: { padding: "10px 12px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalExName: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800 },
  modalSetRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 12px", color: "#d5dbf0", borderBottom: `1px solid ${C.borderSoft}` },
};

/* ============================================================
   HELPERS
============================================================ */
function calcStreak(history) {
  if (!history.length) return 0;
  const days = [...new Set(history.map(h => new Date(h.ts).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if ((new Date(days[i - 1]) - new Date(days[i])) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatRest(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function numOr(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}
function setVolume(s) {
  const w = numOr(s.w), r = parseInt(s.r);
  if (w === null || isNaN(r)) return 0;
  return w * r;
}
// Web Audio beep — no external assets needed, works offline in the artifact sandbox.
let _actx = null;
function beep(kind) {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _actx;
    const now = ctx.currentTime;
    const notes = kind === "done" ? [880, 1174.7] : [660];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    });
  } catch {}
}

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,7 5.5,10.5 12,3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function FitnessTracker({ user }) {
  const [history, setHistory] = useState([]);
  const [prs, setPrs] = useState({});
  const [restDuration, setRestDuration] = useState(90);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [activePlan, setActivePlan] = useState(null);
  const [setStates, setSetStates] = useState({});
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSheet, setShowSheet] = useState(false);
  const [extraExercises, setExtraExercises] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null);
  const timerRef = useRef(null);

  // Rest timer — tracked via absolute end-timestamp so it survives tab
  // navigation and background throttling (recomputed from wall clock).
  const [restEndAt, setRestEndAt] = useState(null);
  const [restTotal, setRestTotal] = useState(restDuration);
  const [restPaused, setRestPaused] = useState(false);
  const [restPauseRemaining, setRestPauseRemaining] = useState(null);
  const [restLabel, setRestLabel] = useState("");
  const [restRemaining, setRestRemaining] = useState(0);
  const restIntervalRef = useRef(null);
  const warnedRef = useRef(false);

  // Load everything from Supabase once, when the app opens
  useEffect(() => {
    async function loadCloudData() {
      const [{ data: workouts }, { data: prsData }, { data: settingsData }] = await Promise.all([
        supabase.from('workouts').select('*').eq('user_id', user.id).order('ts', { ascending: false }),
        supabase.from('prs').select('*').eq('user_id', user.id),
        supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      const prsObj = {};
      (prsData || []).forEach(p => { prsObj[p.exercise_name] = { w: p.w, r: p.r, ts: new Date(p.ts).getTime() }; });
      setHistory((workouts || []).map(w => ({
        id: w.id,
        planId: w.plan_id,
        name: w.name,
        ts: new Date(w.ts).getTime(),
        dur: w.dur,
        totalSets: w.total_sets,
        totalVolume: w.total_volume,
        exercises: w.exercises,
        prHits: w.pr_hits,
      })));
      setPrs(prsObj);
      setRestDuration(settingsData?.rest_duration || 90);
      setLoaded(true);
    }
    loadCloudData();
  }, [user.id]);

  // Save rest-duration setting to the cloud whenever it changes (after initial load)
  useEffect(() => {
    if (!loaded) return;
    supabase.from('settings').upsert({ user_id: user.id, rest_duration: restDuration });
  }, [restDuration, loaded, user.id]);

  useEffect(() => {
    if (timerStart) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - timerStart), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [timerStart]);

  // Rest timer tick loop
  useEffect(() => {
    clearInterval(restIntervalRef.current);
    if (restEndAt === null || restPaused) return;
    restIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining <= 10 && remaining > 0 && !warnedRef.current) {
        warnedRef.current = true;
        beep("warn");
      }
      if (remaining <= 0) {
        beep("done");
        clearInterval(restIntervalRef.current);
        setRestEndAt(null);
      }
    }, 250);
    return () => clearInterval(restIntervalRef.current);
  }, [restEndAt, restPaused]);

  function startRest(exerciseName, overrideSec) {
    const dur = overrideSec || restDuration;
    warnedRef.current = false;
    setRestPaused(false);
    setRestPauseRemaining(null);
    setRestTotal(dur);
    setRestRemaining(dur);
    setRestLabel(exerciseName);
    setRestEndAt(Date.now() + dur * 1000);
  }
  function pauseRest() {
    if (restEndAt === null) return;
    setRestPauseRemaining(Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000)));
    setRestPaused(true);
  }
  function resumeRest() {
    const rem = restPauseRemaining ?? restRemaining;
    setRestEndAt(Date.now() + rem * 1000);
    setRestPaused(false);
  }
  function adjustRest(deltaSec) {
    if (restPaused) {
      setRestPauseRemaining(prev => Math.max(0, (prev ?? 0) + deltaSec));
      setRestRemaining(prev => Math.max(0, prev + deltaSec));
    } else if (restEndAt !== null) {
      setRestEndAt(prev => prev + deltaSec * 1000);
      setRestRemaining(prev => Math.max(0, prev + deltaSec));
    }
  }
  function skipRest() {
    setRestEndAt(null);
    setRestPaused(false);
  }

  function launchDay(planId) {
    const plan = PLANS[planId];
    const ss = {};
    plan.exercises.forEach((ex, ei) => {
      const last = getLastPerformance(ex.name);
      const source = last || ex.defaultSets;
      ss[ei] = source.map(s => ({ w: s.w, r: s.r, done: false }));
    });
    setSetStates(ss);
    setExtraExercises([]);
    setActivePlan(plan);
    setTimerStart(Date.now());
    setTab("workout");
  }

  function updateSet(ei, si, field, val) {
    setSetStates(prev => ({ ...prev, [ei]: prev[ei].map((s, i) => i === si ? { ...s, [field]: val } : s) }));
  }

  function toggleSet(ei, si, exName, exRestSec) {
    setSetStates(prev => {
      const wasDone = prev[ei][si].done;
      const next = { ...prev, [ei]: prev[ei].map((s, i) => i === si ? { ...s, done: !s.done } : s) };
      // Auto-start rest timer the moment a set is marked complete (not un-marked)
      if (!wasDone) startRest(exName, exRestSec);
      return next;
    });
  }

  function addSet(ei) {
    setSetStates(prev => {
      const last = prev[ei].slice(-1)[0] || { w: 25, r: 10, done: false };
      return { ...prev, [ei]: [...prev[ei], { w: last.w, r: last.r, done: false }] };
    });
  }

  function addExercise(ex) {
    setShowSheet(false);
    const last = getLastPerformance(ex.name);
    const source = last || [{ w: 25, r: 10 }, { w: 25, r: 10 }, { w: 25, r: 10 }];
    const newEx = { ...ex, defaultSets: source };
    const ei = activePlan.exercises.length + extraExercises.length;
    setExtraExercises(prev => [...prev, newEx]);
    setSetStates(prev => ({ ...prev, [ei]: source.map(s => ({ w: s.w, r: s.r, done: false })) }));
  }

  // ---- Progressive overload lookups (matched by exercise NAME, not index,
  // so history stays accurate even if extra exercises change the ordering) ----
  const getPrevPerformance = useCallback((exName) => {
    for (const h of history) {
      const found = h.exercises.find(e => e.name === exName);
      if (found) return found.sets;
    }
    return null;
  }, [history]);

  // Used to auto-populate a fresh workout: pulls just the completed sets
  // (weight + reps) from the most recent workout that included this
  // exercise, stripped of `done` so the new session starts unchecked.
  // Returns null if the exercise has never been completed before, so
  // callers can fall back to the plan's defaultSets.
  const getLastPerformance = useCallback((exName) => {
    for (const h of history) {
      const found = h.exercises.find(e => e.name === exName);
      if (!found) continue;
      const completed = found.sets.filter(s => s.done);
      if (completed.length) return completed.map(s => ({ w: s.w, r: s.r }));
    }
    return null;
  }, [history]);

  const getBestPerformance = useCallback((exName) => {
    let best = null;
    history.forEach(h => {
      const found = h.exercises.find(e => e.name === exName);
      if (!found) return;
      const vol = found.sets.reduce((a, s) => a + setVolume(s), 0);
      const maxW = Math.max(0, ...found.sets.map(s => numOr(s.w) || 0));
      if (!best || vol > best.vol) best = { vol, maxW };
    });
    return best;
  }, [history]);

  function finishWorkout() {
    const dur = Math.max(1, Math.round((Date.now() - timerStart) / 60000));
    const allExercises = [...activePlan.exercises, ...extraExercises];
    const newPRs = { ...prs };
    const prHits = [];
    allExercises.forEach((ex, ei) => {
      (setStates[ei] || []).forEach(s => {
        if (!s.done) return;
        const w = numOr(s.w);
        const r = parseInt(s.r) || 0;
        const key = ex.name;
        const prev = newPRs[key];
        const prevW = prev ? numOr(prev.w) : null;
        const prevR = prev ? (parseInt(prev.r) || 0) : 0;

        let isPR;
        if (!prev) {
          // No existing PR for this exercise yet — first completed set is automatically a PR.
          isPR = true;
        } else if (w === null || prevW === null) {
          // Bodyweight / non-numeric load (e.g. "BW") — compare by reps only,
          // so "BW pull-ups x13" beats "BW pull-ups x10".
          isPR = r > prevR;
        } else {
          // Numeric weight — heavier weight always wins; same weight needs more reps.
          isPR = w > prevW || (w === prevW && r > prevR);
        }

        if (isPR) {
          newPRs[key] = { w: s.w, r: s.r, ts: Date.now() };
          prHits.push(ex.name);
        }
      });
    });
    const totalSets = Object.values(setStates).reduce((a, arr) => a + arr.filter(s => s.done).length, 0);
    const totalVolume = allExercises.reduce((acc, e, i) => acc + (setStates[i] || []).filter(s => s.done).reduce((a, s) => a + setVolume(s), 0), 0);
    const entry = {
      id: Date.now(), planId: activePlan.id, name: activePlan.name, ts: Date.now(),
      dur, totalSets, totalVolume,
      exercises: allExercises.map((e, i) => ({ name: e.name, muscle: e.muscle, sets: setStates[i] || [] })),
      prHits,
    };
    setHistory(prev => [entry, ...prev]);
    setPrs(newPRs);

    // Push this workout to the cloud
    supabase.from('workouts').insert({
      user_id: user.id,
      plan_id: entry.planId,
      name: entry.name,
      dur: entry.dur,
      total_sets: entry.totalSets,
      total_volume: entry.totalVolume,
      exercises: entry.exercises,
      pr_hits: entry.prHits,
    });

    // Push updated PRs to the cloud
    Object.entries(newPRs).forEach(([exercise_name, pr]) => {
      supabase.from('prs').upsert({ user_id: user.id, exercise_name, w: String(pr.w), r: String(pr.r) });
    });

    setActivePlan(null);
    setTimerStart(null);
    setRestEndAt(null);
    setTab("history");
  }

  function discardWorkout() {
    setActivePlan(null);
    setTimerStart(null);
    setSetStates({});
    setRestEndAt(null);
    setTab("dashboard");
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow',sans-serif" }}>
        Loading your data...
      </div>
    );
  }

  const weekCount = history.filter(h => h.ts > Date.now() - 7 * 86400000).length;
  const streak = calcStreak(history);
  const allExInWorkout = activePlan ? [...activePlan.exercises, ...extraExercises] : [];
  const usedExNames = new Set(allExInWorkout.map(e => e.name));
  const sheetOptions = EXTRA_EXERCISES.filter(e => !usedExNames.has(e.name));
  const restShowing = restEndAt !== null || restPaused;
  const restPct = restTotal ? Math.max(0, Math.min(100, ((restPaused ? (restPauseRemaining ?? restRemaining) : restRemaining) / restTotal) * 100)) : 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.app}>
        <div style={S.heroBar}>
          <div style={S.goalLine}>Goal: 150 lbs → 170 lbs · 3-Month Build</div>
          <div style={S.h1}>MUSCLE BUILDER</div>
          <div style={S.subtitle}><span>💪</span> 16 y/o · 6'0" · Upper/Lower Split <span style={{ color: C.orange, fontWeight: 700 }}>· 🛡 Wrist Rehab Active</span></div>
        </div>

        <div style={S.screen}>
          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div style={S.page}>
              <div style={S.secHdr}>This Week</div>
              <div style={S.statGrid}>
                {[["🔥", streak, "Streak", "linear-gradient(135deg,#ff8a3d33,#ff5c5c22)", C.orange], ["📅", weekCount, "This Week", "linear-gradient(135deg,#3e8bff33,#22d3ee22)", C.blue], ["💪", history.length, "Total", "linear-gradient(135deg,#a06bff33,#fb5aa022)", C.purple]].map(([icon, val, lbl, bg, glow]) => (
                  <div style={S.statCard(glow)} key={lbl}>
                    <div style={S.statIconWrap(bg)}>{icon}</div>
                    <div style={S.statVal}>{val}</div>
                    <div style={S.statLbl}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={S.secHdr}>⚡ Quick Launch</div>
              <div style={S.dayGrid}>
                {PLANS.map(p => (
                  <div key={p.id} style={S.dayBtn(p.accent)} onClick={() => launchDay(p.id)}>
                    <span style={S.dayIcon}>{p.icon}</span>
                    <div style={S.dayTag(p.accent)}>{p.label} · {p.focus}</div>
                    <div style={S.dayName}>{p.name}</div>
                    <div style={S.dayMuscles}>{p.muscles}</div>
                  </div>
                ))}
              </div>

              <div style={S.secHdr}>🏆 Personal Records</div>
              <div style={S.prCard}>
                {Object.entries(prs).length === 0 ? (
                  <div style={{ padding: "18px 13px", color: C.sub, fontSize: 13 }}>No PRs yet — start a workout to set your first one!</div>
                ) : (
                  Object.entries(prs).sort((a, b) => b[1].ts - a[1].ts).slice(0, 5).map(([ex, pr]) => (
                    <div key={ex} style={S.prRow}>
                      <div style={S.prTrophy}>🏆</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.prName}>{ex}</div>
                        <div style={{ fontSize: 10, color: C.sub }}>{new Date(pr.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                      <div>
                        <div style={S.prVal}>{pr.w} lbs</div>
                        <div style={S.prDate}>×{pr.r} reps</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* WORKOUT */}
          {tab === "workout" && (
            !activePlan ? (
              <div style={S.emptyBox}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>🏋️</div>
                <div style={{ fontSize: 15, marginBottom: 4 }}>No workout in progress.</div>
                <div style={{ fontSize: 13, color: C.subDim }}>Pick a day from the Dashboard.</div>
                <button style={S.noWorkoutBtn} onClick={() => setTab("dashboard")}>← Dashboard</button>
              </div>
            ) : (
              <>
                <div style={S.wHdr}>
                  <div>
                    <div style={S.wTitle}>{activePlan.icon} {activePlan.name}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                  </div>
                  <div style={S.timer}>{formatTime(elapsed)}</div>
                </div>
                <div style={S.page}>
                  <div style={S.secHdr}>⏱ Rest Timer Default</div>
                  <div style={S.restSelectWrap}>
                    {REST_OPTIONS.map(sec => (
                      <div key={sec} style={S.restChip(restDuration === sec)} onClick={() => setRestDuration(sec)}>
                        {sec < 60 ? `${sec}s` : `${sec / 60}${sec % 60 ? `:${sec % 60}` : "m"}`}
                      </div>
                    ))}
                  </div>

                  <div style={S.warmCard}>
                    <div style={S.warmHdr}>⚡ Warmup — 5 min</div>
                    {activePlan.warmup.map((w, i) => (
                      <div key={i} style={S.warmItem}><span style={{ color: C.blue, flexShrink: 0 }}>›</span>{w}</div>
                    ))}
                  </div>

                  {allExInWorkout.map((ex, ei) => {
                    const prevSets = getPrevPerformance(ex.name);
                    const best = getBestPerformance(ex.name);
                    const accent = getColor(ex.muscle);
                    return (
                      <div key={ei} style={S.exCard(accent)}>
                        <div style={S.exHdr}>
                          <div style={S.exNameRow}>
                            <div>
                              <div style={S.exName}>{ex.name}</div>
                              <div style={S.exMuscle}>{ex.muscle}</div>
                            </div>
                            {best && <div style={S.exBestBadge}>🏆 Best {best.maxW} lbs</div>}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                            {ex.wrist && <div style={S.wristBadge}>🛡 Neutral grip only</div>}
                            <div style={{ fontSize: 10, color: C.subDim, fontWeight: 700, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px" }}>⏱ Rest {formatRest(ex.restSec || restDuration)}</div>
                          </div>
                        </div>
                        {prevSets && (
                          <div style={S.prevRow}>
                            <span style={{ color: C.subDim, fontWeight: 700 }}>LAST TIME:</span>
                            {prevSets.map((s, i) => <span key={i}>{s.w}×{s.r}</span>)}
                          </div>
                        )}
                        <table style={S.tbl}>
                          <thead>
                            <tr>{["#", "Prev", "Weight", "Reps", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {(setStates[ei] || []).map((s, si) => {
                              const prevSet = prevSets?.[si];
                              const prevText = prevSet ? `${prevSet.w}×${prevSet.r}` : "—";
                              const isStr = typeof s.w === "string" && isNaN(parseFloat(s.w));
                              return (
                                <tr key={si} style={{ background: s.done ? "rgba(49,214,138,0.08)" : "transparent" }}>
                                  <td style={{ ...S.td, fontWeight: 800, color: C.subDim }}>{si + 1}</td>
                                  <td style={{ ...S.td, fontSize: 11, color: C.subDim }}>{prevText}</td>
                                  <td style={S.td}>
                                    <input style={S.input} type={isStr ? "text" : "number"} value={s.w} onChange={e => updateSet(ei, si, "w", e.target.value)} />
                                  </td>
                                  <td style={S.td}>
                                    <input style={{ ...S.input, width: 46 }} type="text" value={s.r} onChange={e => updateSet(ei, si, "r", e.target.value)} />
                                  </td>
                                  <td style={S.td}>
                                    <button style={S.checkBtn(s.done)} onClick={() => toggleSet(ei, si, ex.name, ex.restSec)}><CheckIcon /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <button style={S.addSetBtn} onClick={() => addSet(ei)}>+ Add Set</button>
                      </div>
                    );
                  })}

                  <button style={S.addExBtn} onClick={() => setShowSheet(true)}>+ Add Exercise</button>

                  <div style={S.warmCard}>
                    <div style={S.warmHdr}>🧘 Cooldown — 5 min</div>
                    {activePlan.cooldown.map((w, i) => (
                      <div key={i} style={S.warmItem}><span style={{ color: C.purple, flexShrink: 0 }}>›</span>{w}</div>
                    ))}
                  </div>

                  <div style={S.actionBar}>
                    <button style={S.btnFinish} onClick={finishWorkout}>✓ Finish</button>
                    <button style={S.btnDiscard} onClick={discardWorkout}>Discard</button>
                  </div>
                </div>
              </>
            )
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div style={S.page}>
              <div style={S.secHdr}>📋 Workout Log</div>
              {history.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 42, marginBottom: 10 }}>📋</div>
                  <div>No workouts logged yet.</div>
                </div>
              ) : history.map(h => (
                <div key={h.id} style={S.histItem} onClick={() => setHistoryDetail(h)}>
                  <div style={S.histTop}>
                    <div style={S.histName}>{h.name}</div>
                    <div style={S.histDate}>{new Date(h.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div style={S.histMeta}>
                    <span>⏱ {h.dur} min</span>
                    <span>✓ {h.totalSets} sets</span>
                    {h.totalVolume ? <span>🏋️ {Math.round(h.totalVolume).toLocaleString()} lbs vol</span> : null}
                  </div>
                  <div style={S.pillRow}>
                    {h.exercises.map((e, i) => {
                      const isPR = h.prHits?.includes(e.name);
                      return <span key={i} style={S.pill(isPR)}>{isPR && <span>🏆</span>}{e.name}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROGRESS */}
          {tab === "progress" && (
            <div style={S.page}>
              <div style={S.secHdr}>📊 Weekly Volume by Muscle</div>
              <div style={S.chartCard}>
                <div style={S.chartHdr}>Sets per Muscle — Last 7 Days</div>
                {(() => {
                  const vol = {};
                  history.filter(h => h.ts > Date.now() - 7 * 86400000).forEach(h =>
                    h.exercises.forEach(e => {
                      const m = e.muscle.split("/")[0];
                      const done = e.sets.filter(s => s.done).length;
                      vol[m] = (vol[m] || 0) + done;
                    })
                  );
                  const entries = Object.entries(vol).sort((a, b) => b[1] - a[1]);
                  const max = Math.max(...entries.map(e => e[1]), 1);
                  return entries.length ? entries.map(([m, v]) => (
                    <div key={m} style={S.barRow}>
                      <div style={S.barLabel}>{m}</div>
                      <div style={S.barTrack}>
                        <div style={{ height: "100%", borderRadius: 5, width: `${Math.round(v / max * 100)}%`, background: `linear-gradient(90deg,${getColor(m)},${getColor(m)}cc)`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif" }}>{v}</div>
                      </div>
                    </div>
                  )) : <div style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 16 }}>Complete workouts to see volume data.</div>;
                })()}
              </div>

              <div style={S.secHdr}>📈 Strength Trends</div>
              {(() => {
                const exData = {};
                [...history].reverse().forEach(h =>
                  h.exercises.forEach(e => {
                    const done = e.sets.filter(s => s.done && numOr(s.w) !== null);
                    if (!done.length) return;
                    const maxW = Math.max(...done.map(s => numOr(s.w)));
                    if (!exData[e.name]) exData[e.name] = [];
                    exData[e.name].push({ ts: h.ts, w: maxW });
                  })
                );
                const entries = Object.entries(exData);
                if (!entries.length) return <div style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 16 }}>Complete workouts to see trends.</div>;
                return entries.map(([name, pts]) => {
                  const pr = Math.max(...pts.map(p => p.w));
                  const minW = Math.min(...pts.map(p => p.w));
                  const range = pr - minW || 1;
                  const W = 300, H = 52, pad = 5;
                  const coords = pts.map((p, i) => `${pad + i * (W - 2 * pad) / Math.max(pts.length - 1, 1)},${H - pad - (p.w - minW) / range * (H - 2 * pad)}`).join(" ");
                  return (
                    <div key={name} style={S.sparkCard}>
                      <div style={S.sparkHdr}>
                        <div>
                          <div style={S.sparkName}>{name}</div>
                          <div style={{ fontSize: 11, color: C.sub }}>{pts.length} session{pts.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={S.sparkPR}>{pr} lbs</div>
                          <div style={{ fontSize: 10, color: C.sub }}>PR</div>
                        </div>
                      </div>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
                        {pts.length > 1 && <polyline points={coords} fill="none" stroke={C.cyan} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
                        {pts.map((p, i) => <circle key={i} cx={pad + i * (W - 2 * pad) / Math.max(pts.length - 1, 1)} cy={H - pad - (p.w - minW) / range * (H - 2 * pad)} r="3.5" fill={C.cyan} />)}
                      </svg>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Rest Timer Bar — floats above bottom nav, persists across tabs */}
        {restShowing && (
          <div style={S.restBar}>
            <div style={S.restTop}>
              <div>
                <div style={S.restLabel}>💤 Resting · {restLabel}</div>
              </div>
              <div style={S.restTime}>{formatRest(restPaused ? (restPauseRemaining ?? restRemaining) : restRemaining)}</div>
            </div>
            <div style={S.restTrack}>
              <div style={{ height: "100%", width: `${restPct}%`, background: "linear-gradient(90deg,#a06bff,#fb5aa0)", transition: "width 0.25s linear" }} />
            </div>
            <div style={S.restControls}>
              <div style={S.restBtn} onClick={() => adjustRest(-15)}>-15s</div>
              <div style={S.restBtnMain} onClick={restPaused ? resumeRest : pauseRest}>{restPaused ? "▶ Resume" : "⏸ Pause"}</div>
              <div style={S.restBtn} onClick={() => adjustRest(15)}>+15s</div>
              <div style={S.restBtn} onClick={skipRest}>Skip</div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <nav style={S.nav}>
          {[["dashboard", "🏠", "Home", C.blue], ["workout", "🏋️", "Workout", C.orange], ["history", "📋", "Log", C.purple], ["progress", "📈", "Progress", C.cyan]].map(([id, icon, label, accent]) => (
            <button key={id} style={S.navBtn(tab === id, accent)} onClick={() => setTab(id)}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Add Exercise Sheet */}
        {showSheet && (
          <>
            <div style={S.sheetOverlay} onClick={() => setShowSheet(false)} />
            <div style={S.sheet}>
              <div style={S.sheetHdr}>
                <span>Add Exercise</span>
                <span style={{ cursor: "pointer" }} onClick={() => setShowSheet(false)}>✕</span>
              </div>
              {sheetOptions.map((ex, i) => (
                <div key={i} style={S.exOpt} onClick={() => addExercise(ex)}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: getColor(ex.muscle), marginTop: 2, fontWeight: 700 }}>{ex.muscle}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* History Detail Modal — full training-journal view */}
        {historyDetail && (
          <div style={S.modalOverlay} onClick={() => setHistoryDetail(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={S.modalHdr}>
                <div>
                  <div style={S.modalTitle}>{historyDetail.name}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                    {new Date(historyDetail.ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div style={S.modalClose} onClick={() => setHistoryDetail(null)}>✕</div>
              </div>

              <div style={S.modalStatGrid}>
                <div style={S.modalStatCard}><div style={S.modalStatVal}>{historyDetail.dur}</div><div style={S.modalStatLbl}>Minutes</div></div>
                <div style={S.modalStatCard}><div style={S.modalStatVal}>{historyDetail.totalSets}</div><div style={S.modalStatLbl}>Sets</div></div>
                <div style={S.modalStatCard}><div style={S.modalStatVal}>{Math.round(historyDetail.totalVolume || 0).toLocaleString()}</div><div style={S.modalStatLbl}>Volume (lbs)</div></div>
              </div>

              {historyDetail.exercises.map((e, i) => {
                const isPR = historyDetail.prHits?.includes(e.name);
                const vol = e.sets.reduce((a, s) => a + setVolume(s), 0);
                return (
                  <div key={i} style={S.modalExBlock}>
                    <div style={S.modalExHdr}>
                      <div>
                        <div style={S.modalExName}>{isPR ? "🏆 " : ""}{e.name}</div>
                        <div style={{ fontSize: 10, color: getColor(e.muscle), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{e.muscle}</div>
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{vol ? `${Math.round(vol).toLocaleString()} lbs` : ""}</div>
                    </div>
                    {e.sets.filter(s => s.done).map((s, si) => (
                      <div key={si} style={S.modalSetRow}>
                        <span>Set {si + 1}</span>
                        <span style={{ fontWeight: 700 }}>{s.w} × {s.r}</span>
                      </div>
                    ))}
                    {e.sets.filter(s => s.done).length === 0 && (
                      <div style={{ ...S.modalSetRow, color: C.subDim }}>No completed sets</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}