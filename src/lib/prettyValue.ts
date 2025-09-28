export function prettyValue(v: any): string {
 if (v == null) return "";
 if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);

 // City pattern из нашего проекта (см. единый паттерн City)
 if (typeof v === "object") {
 // Если есть заранее нормализованное поле formatted — приоритетно
 if ("formatted" in v && typeof (v as any).formatted === "string") return (v as any).formatted;
 // Популярные поля города
 const keys = Object.keys(v);
 const city = (v as any).city || (v as any).name;
 const stateCode = (v as any).stateCode || (v as any).state;
 const countryCode = (v as any).countryCode || (v as any).country;
 if (city || stateCode || countryCode) {
 return [city, stateCode, countryCode].filter(Boolean).join(", ");
 }
 // Массив объектов?
 if (Array.isArray(v)) {
 return v.map(prettyValue).join(", ");
 }
 // Объект неизвестной формы — компактный JSON без вложенности
 try {
 return JSON.stringify(v);
 } catch {
 return "[object]";
 }
 }

 // Фолбэк
 try { return JSON.stringify(v); } catch { return String(v); }
}
