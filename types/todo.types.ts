export interface TodoFolder {
  id: string;
  name: string;
  createdAt: string;
  order: number;
}

export interface TodoTask {
  id: string;
  folderId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
