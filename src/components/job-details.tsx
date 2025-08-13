"use client";

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';

interface JobDetailsProps {
  job: Job;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isManager: boolean;
}

const statusColors: { [key: string]: string } = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Finished: 'bg-green-100 text-green-800',
  'To Be Continued': 'bg-yellow-100 text-yellow-800',
  Problem: 'bg-red-100 text-red-800',
};

export default function JobDetails({ job, isOpen, setIsOpen, isManager }: JobDetailsProps) {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: Job['status']) => {
    const jobRef = doc(db, 'jobs', job.id);
    try {
      await updateDoc(jobRef, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Job #${job.contractNumber} is now ${newStatus}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update job status.',
      });
    }
  };

  const addons = Object.entries(job.addons)
    .filter(([, value]) => value)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))
    .join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Job Details: #{job.contractNumber}</DialogTitle>
          <DialogDescription>
            {job.clientAddress}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center">
             <Badge className={statusColors[job.status]}>{job.status}</Badge>
            <span className="text-sm text-muted-foreground">{job.date} at {job.time}</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Client Information</h4>
            <p className="text-sm"><strong>Address:</strong> {job.clientAddress}</p>
            <p className="text-sm"><strong>Phone:</strong> {job.clientPhone}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Job Specifications</h4>
            <p className="text-sm"><strong>Windows:</strong> {job.windowCount}</p>
            <p className="text-sm"><strong>Total Sq. Meters:</strong> {job.squareMeters}</p>
            <p className="text-sm"><strong>Total Circumference:</strong> {job.circumference}</p>
            <p className="text-sm"><strong>Add-ons:</strong> {addons || 'None'}</p>
            <p className="text-sm"><strong>Assigned Team:</strong> {job.teamName}</p>
          </div>
          
           <div className="space-y-2">
             <h4 className="font-semibold">Notes</h4>
             <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{job.notes || 'No notes provided.'}</div>
           </div>

          {isManager && (
            <div className="space-y-2">
              <Label htmlFor="status-update" className="font-semibold">Update Status</Label>
              <Select onValueChange={(value: Job['status']) => handleStatusChange(value)} defaultValue={job.status}>
                <SelectTrigger id="status-update">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Finished">Finished</SelectItem>
                  <SelectItem value="To Be Continued">To Be Continued</SelectItem>
                  <SelectItem value="Problem">Problem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
