/**
 * Jalali Date Conversion and Formatting Utilities
 */
import * as jalaali from "jalaali-js";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];

export const WEEKDAYS_SHORT = [
  "ش", // شنبه
  "ی", // یکشنبه
  "د", // دوشنبه
  "س", // سه‌شنبه
  "چ", // چهارشنبه
  "پ", // پنج‌شنبه
  "ج"  // جمعه
];

export const WEEKDAYS_FULL = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه"
];

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const res = jalaali.toJalaali(gy, gm, gd);
  return [res.jy, res.jm, res.jd];
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const res = jalaali.toGregorian(jy, jm, jd);
  return [res.gy, res.gm, res.gd];
}

export function isJalaliLeap(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function getJalaliMonthStartWeekday(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  const date = new Date(gy, gm - 1, gd);
  const gDay = date.getDay(); // 0 is Sunday, 6 is Saturday
  return (gDay + 1) % 7; // Saturday becomes 0, Friday becomes 6
}

export function getTodayJalaliString(): string {
  const d = new Date();
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const yStr = jy.toString();
  const mStr = jm < 10 ? `0${jm}` : jm.toString();
  const dStr = jd < 10 ? `0${jd}` : jd.toString();
  return `${yStr}/${mStr}/${dStr}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const hStr = h < 10 ? `0${h}` : h.toString();
  const mStr = m < 10 ? `0${m}` : m.toString();
  return `${hStr}:${mStr}`;
}

export function isTaskOverdue(dateStr: string, timeStr: string): boolean {
  // dateStr format: YYYY/MM/DD, timeStr format: HH:MM
  const todayJalali = getTodayJalaliString();
  if (dateStr < todayJalali) {
    return true;
  }
  if (dateStr === todayJalali) {
    const curTime = getCurrentTimeString();
    return timeStr < curTime;
  }
  return false;
}

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  // Returns difference in days (dateStr1 - dateStr2)
  const p1 = dateStr1.split("/");
  const p2 = dateStr2.split("/");
  if (p1.length !== 3 || p2.length !== 3) return 0;
  
  const [g1y, g1m, g1d] = jalaliToGregorian(parseInt(p1[0], 10), parseInt(p1[1], 10), parseInt(p1[2], 10));
  const [g2y, g2m, g2d] = jalaliToGregorian(parseInt(p2[0], 10), parseInt(p2[1], 10), parseInt(p2[2], 10));
  
  const date1 = new Date(g1y, g1m - 1, g1d);
  const date2 = new Date(g2y, g2m - 1, g2d);
  
  const diffTime = date1.getTime() - date2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatJalaliDateFull(dateStr: string): string {
  // input: YYYY/MM/DD
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  
  // Find weekday
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd);
  const gDay = date.getDay();
  const pIndex = (gDay + 1) % 7;
  const weekdayName = WEEKDAYS_FULL[pIndex];
  const monthName = JALALI_MONTHS[jm - 1];
  
  return `${weekdayName} ${jd} ${monthName} ${jy}`;
}

export function convertToPersianNumbers(str: string | number): string {
  const strVal = String(str);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return strVal.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}
