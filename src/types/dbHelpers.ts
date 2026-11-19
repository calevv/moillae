import type { Database } from './database';

type Moillae = Database['moillae'];

// 테이블 한 줄의 모양. 예: TableRow<"profiles">
export type TableRow<T extends keyof Moillae['Tables']> = Moillae['Tables'][T]['Row'];
