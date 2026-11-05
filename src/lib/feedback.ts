export type ToastKind = 'ok' | 'alarm' | 'info';

export type Toast = {
	id: number;
	kind: ToastKind;
	text: string;
};

let seq = 0;

export function makeToast(kind: ToastKind, text: string): Toast {
	seq += 1;
	return { id: seq, kind, text };
}
