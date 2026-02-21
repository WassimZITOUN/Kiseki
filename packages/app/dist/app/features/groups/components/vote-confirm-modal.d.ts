type Props = {
    visible: boolean;
    targetName: string;
    contextNote: string;
    onChangeContextNote: (text: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    submitting: boolean;
};
export declare function VoteConfirmModal({ visible, targetName, contextNote, onChangeContextNote, onConfirm, onCancel, submitting, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
