import { bangs } from "./bang";

type BangType = (typeof bangs)[number];

type BangLookupType = Record<string, BangType>;

function getCustomBangs() {
  return JSON.parse(
    localStorage.getItem("customBangs") ?? "{}",
  ) as BangLookupType;
}

function mergeBangs(bangLeft: BangLookupType, bangRight: BangLookupType) {
  return { ...bangLeft, ...bangRight };
}

function transformToLookup(bangList: typeof bangs) {
  return bangList.reduce<BangLookupType>((acc, cur) => {
    acc[cur["t"]] = cur;
    return acc;
  }, {});
}

function setDefaultSearchEngine(searchEngineBang: string) {
  if (!bangs.find((b) => b.t === searchEngineBang)) {
    throw new Error("invalid search engine");
  }
  localStorage.setItem("default-bang", searchEngineBang);
}
