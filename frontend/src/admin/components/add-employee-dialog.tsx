import { createPortal } from 'react-dom';

import type { CreateEmployeeInput } from '../types';

import { AddEmployeeForm } from './add-employee-form';

export function AddEmployeeDialog({
  open,
  nextEmployeeId,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  nextEmployeeId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateEmployeeInput) => void;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="bg-foreground/40 absolute inset-0"
        aria-label="Close dialog"
        onClick={() => {
          onOpenChange(false);
        }}
      />
      <AddEmployeeForm nextEmployeeId={nextEmployeeId} onOpenChange={onOpenChange} onSave={onSave} />
    </div>,
    document.body,
  );
}
