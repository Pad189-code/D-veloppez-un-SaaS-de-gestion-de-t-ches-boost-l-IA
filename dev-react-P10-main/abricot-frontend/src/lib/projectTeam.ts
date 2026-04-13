export type ProjectUser = {
  id: string;
  name: string | null;
  email: string;
};

/** Ligne projet pour la liste : propriétaire + contributeurs (hors doublon propriétaire). */
export type ProjectListRow = {
  id: string;
  name: string;
  description: string | null;
  owner: ProjectUser;
  collaborators: ProjectUser[];
};

export function initialsFromUser(user: ProjectUser): string {
  const n = user.name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = user.email.split('@')[0] ?? user.email;
  return local.slice(0, 2).toUpperCase();
}

export function normalizeProjectListRow(
  id: string,
  name: string,
  description: string | null,
  owner: ProjectUser | null | undefined,
  collaboratorsNested: Array<{ user: ProjectUser }> | undefined,
): ProjectListRow {
  const o: ProjectUser = owner && owner.id ? owner : { id: '_', name: null, email: '?' };
  const contributors = (collaboratorsNested ?? []).map((c) => c.user).filter((u) => u.id !== o.id);
  return {
    id,
    name,
    description,
    owner: o,
    collaborators: contributors,
  };
}

export function teamMemberCount(row: ProjectListRow): number {
  return 1 + row.collaborators.length;
}
