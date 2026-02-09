"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
  title: string;
  description: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title,
  description,
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          결제 모달 (PortOne 연동 예정) · 확인 시 포인트 차감 또는 결제 진행
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={() => onConfirm()} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "처리 중…" : "결제 진행"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
