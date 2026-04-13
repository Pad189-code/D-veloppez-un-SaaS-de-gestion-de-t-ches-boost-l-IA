/** Affichage liste (nom ou e-mail) */
export type TaskAssigneeDisplay = { id: string; label: string };

export type TaskCommentPreview = {
  id: string;
  content: string;
  createdAt: string;
  authorLabel: string;
};

export type TaskCardModel = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  assigneeIds: string[];
  assignees?: TaskAssigneeDisplay[];
  commentCount: number;
  commentsPreview?: TaskCommentPreview[];
};
