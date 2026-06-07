"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/lib/hooks/useNotifications";

const COMMISSION_ISSUE_SUBJECTS = [
  "Missing Commission Payment",
  "Late Payment",
  "Incorrect Amount",
  "Calculation Discrepancy",
  "Unpaid Periods",
  "Other Commission Issue",
];

type CommissionIssueDialogProps = {
  frequency: "daily" | "weekly" | "monthly";
  unpaidPeriods?: number;
  expectedDate?: Date;
  lastPaidDate?: Date | null;
  workerName?: string;
  userId?: string;
  onSent?: () => void;
};

export function CommissionIssueDialog({
  frequency,
  unpaidPeriods = 0,
  expectedDate,
  lastPaidDate,
  workerName,
  userId,
  onSent,
}: CommissionIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(COMMISSION_ISSUE_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { createNotification, isCreatingNotification } = useNotifications();

  // Pre-fill message with context
  const getPrefilledMessage = () => {
    const frequencyText = frequency === "daily" ? "daily" : frequency === "weekly" ? "weekly" : "monthly";
    let context = `Commission Issue Report\n\n`;
    context += `Frequency: ${frequencyText}\n`;
    
    if (unpaidPeriods > 0) {
      context += `Unpaid Periods: ${unpaidPeriods} ${frequencyText} period${unpaidPeriods > 1 ? 's' : ''}\n`;
    }
    
    if (expectedDate) {
      context += `Expected Payment Date: ${expectedDate.toLocaleDateString()}\n`;
    }
    
    if (lastPaidDate) {
      context += `Last Payment Received: ${lastPaidDate.toLocaleDateString()}\n`;
    }
    
    if (workerName) {
      context += `Worker: ${workerName}\n`;
    }
    
    if (userId) {
      context += `Worker ID: ${userId}\n`;
    }
    
    context += `\n---\n\n`;
    return context;
  };

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Please add details about your commission issue.");
      return;
    }

    setIsSending(true);

    try {

      createNotification({
            userId: userId!,
            type: "commission_issue_reported",
            title: subject,
            message: `${JSON.stringify({
                message: getPrefilledMessage() + message.trim(),
                frequency,
                unpaidPeriods,
                expectedDate,
                lastPaidDate,
                userId,
                })
            }`,
          });

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Commission issue reported. HR will review within 24 hours.");
      setOpen(false);
      setMessage("");
      onSent?.();
    } catch (error) {
      toast.error("Unable to send report. Please try again or contact support directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>⚠️</span>
          Report Commission Issue
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Report Commission Issue</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Submit a report about missing, late, or incorrect commission payments.
          </p>
        </DialogHeader>

        {/* Summary of detected issues */}
        {(unpaidPeriods > 0 || expectedDate) && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Detected Issues:</p>
            {unpaidPeriods > 0 && (
              <p className="text-amber-700 dark:text-amber-400">
                • {unpaidPeriods} unpaid {frequency} period{unpaidPeriods > 1 ? 's' : ''}
              </p>
            )}
            {expectedDate && new Date() > expectedDate && (
              <p className="text-amber-700 dark:text-amber-400">
                • Payment overdue since {expectedDate.toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label>Issue Type</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_ISSUE_SUBJECTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue in detail. Include specific dates, amounts, or any relevant information that will help HR investigate quickly."
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              The system will automatically include your commission history with this report.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMessage(prev => prev + "\n\nI haven't received any commission for the past period(s). Please investigate.")}
              className="text-xs"
            >
              Quick: Missing Payment
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMessage(prev => prev + "\n\nThe amount I received seems incorrect. Expected amount was different.")}
              className="text-xs"
            >
              Quick: Wrong Amount
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSending}>
            {isSending ? "Sending..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}