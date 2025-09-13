export function initialsFrom(nameOrEmail?: string | null) {
 if (!nameOrEmail) return "U";
 const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
 const parts = base.trim().split(/[.\s_-]+/).filter(Boolean);
 const two = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
 const one = parts[0]?.slice(0, 2) ?? "U";
 return (two || one).toUpperCase();
}