// Runs a server action that can award XP/Coins/achievements and plays the celebrations.
import { S, refreshMe, levelFx } from './api.js';
import { celebrate, toast } from './util.js';
import { sfx } from './sound.js';

export async function withReward(fn, { silent = false, from } = {}) {
  try {
    const res = await fn();
    await refreshMe();
    if (!silent) await celebrate(res, { petId: S.me.active_companion, fx: levelFx(), from });
    return res;
  } catch (e) {
    toast(e.message || 'Something went wrong', 'bad'); sfx.error();
    throw e;
  }
}

export async function safely(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg, 'good');
    return r;
  } catch (e) {
    toast(e.message || 'Something went wrong', 'bad');
    return undefined;
  }
}
