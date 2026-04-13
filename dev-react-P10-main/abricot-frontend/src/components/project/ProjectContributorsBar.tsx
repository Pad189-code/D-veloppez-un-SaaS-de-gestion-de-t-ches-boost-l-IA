function initials(name: string | null, email: string): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export type ProjectMemberChip = {
  id: string;
  name: string | null;
  email: string;
  isOwner: boolean;
};

export default function ProjectContributorsBar({ members }: { members: ProjectMemberChip[] }) {
  const count = members.length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-[#F3F4F6] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-[#374151]">
        Contributeurs{' '}
        <span className="font-normal text-gray-500">
          {count} personne{count > 1 ? 's' : ''}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {members.map((m) => {
          const label = (m.name && m.name.trim()) || m.email;
          const ini = initials(m.name, m.email);
          const isPeach = m.isOwner;
          return (
            <div
              key={m.id}
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white py-1.5 pl-1.5 pr-3 shadow-sm"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isPeach ? 'bg-[#FDEEE7] text-[#E86B32]' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {ini}
              </span>
              <span className="text-sm font-medium text-[#111827]">
                {label}
                {m.isOwner && (
                  <span className="ml-1.5 text-xs font-normal text-[#E86B32]">Propriétaire</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
