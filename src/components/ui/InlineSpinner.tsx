export default function InlineSpinner({ text = "Loading..." }: { text?: string }) {
  return <span className="text-sm text-muted-foreground">{text}</span>;
}
