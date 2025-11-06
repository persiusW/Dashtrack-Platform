import Link from "next/link";

export default function EmptyState({
  title,
  desc,
  actions,
}: {
  title: string;
  desc: string;
  actions?: { href?: string; label: string; primary?: boolean; onClick?: () => void }[];
}) {
  return (
    <div className="reveal rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{desc}</p>
      {actions && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions.map((a, i) => {
            const cls = `btn-press rounded-lg px-4 py-2 text-sm ${
              a.primary ? "bg-black text-white hover:bg-gray-900" : "border hover:bg-gray-50"
            }`;
            if (a.href && !a.onClick) {
              return (
                <Link key={i} href={a.href} className={cls}>
                  {a.label}
                </Link>
              );
            }
            return (
              <button key={i} type="button" onClick={a.onClick} className={cls}>
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
