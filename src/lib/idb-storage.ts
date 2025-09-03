import { get, set, del, keys } from 'idb-keyval';

export const idbStorage = {
  getItem: async (name: string) => {
    const allKeys = await keys();
    const state: { [key: string]: any } = {};
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(name)) {
        const stateKey = key.substring(name.length + 1);
        state[stateKey] = await get(key);
      }
    }
    return { state };
  },
  setItem: async (name: string, value: any) => {
    for (const key in value.state) {
      await set(`${name}/${key}`, value.state[key]);
    }
  },
  removeItem: async (name: string) => {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(name)) {
        await del(key);
      }
    }
  },
};