import { SERVICES_OPTIONS } from "@/constants/options";
import { LANGUAGE_OPTIONS } from "@/constants/options";

const serviceMap = new Map(SERVICES_OPTIONS.map(o => [o.value, o]));
const languageMap = new Map(LANGUAGE_OPTIONS.map(o => [o.value, o]));

export function renderServiceTag(v: string) {
  const o: any = serviceMap.get(v);
  const label = o?.label ?? v;
  const emoji = o?.emoji ?? "";
  return `${emoji ? emoji + " " : ""}${label}`;
}

export function renderLanguageTag(v: string) {
  const o: any = languageMap.get(v);
  const label = o?.label ?? v;
  const flag = o?.emoji ?? "";
  return `${flag ? flag + " " : ""}${label}`;
}
