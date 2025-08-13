"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Job, Team } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const jobFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  estimatedTime: z.string().min(1, 'Estimated time is required'),
  contractNumber: z.string().min(1, 'Contract number is required'),
  clientAddress: z.string().min(1, 'Client address is required'),
  clientPhone: z.string().min(1, 'Client phone is required'),
  windowCount: z.coerce.number().min(1, 'Window count must be at least 1'),
  squareMeters: z.coerce.number().min(0.1, 'Square meters are required'),
  circumference: z.coerce.number().min(0.1, 'Circumference is required'),
  addons: z.object({
    innerSills: z.boolean(),
    outerSills: z.boolean(),
    finishing: z.boolean(),
    tape: z.boolean(),
    extras: z.boolean(),
  }),
  notes: z.string().optional(),
  teamId: z.string().min(1, 'A team must be selected'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobForm() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      date: '',
      time: '',
      estimatedTime: '',
      contractNumber: '',
      clientAddress: '',
      clientPhone: '',
      windowCount: 1,
      squareMeters: 0,
      circumference: 0,
      addons: { innerSills: false, outerSills: false, finishing: false, tape: false, extras: false },
      notes: '',
      teamId: '',
    },
  });

  useEffect(() => {
    const allTeams = storage.getTeams();
    setTeams(allTeams);
  }, []);

  const checkConflicts = (newJob: JobFormValues): boolean => {
    const existingJobs = storage.getJobs();
    const jobsOnSameDay = existingJobs.filter(
      job => job.teamId === newJob.teamId && job.date === newJob.date
    );
    
    // Basic time overlap check
    const newJobStart = new Date(`${newJob.date}T${newJob.time}`).getTime();
    return jobsOnSameDay.some(job => {
      const existingJobStart = new Date(`${job.date}T${job.time}`).getTime();
      return newJobStart === existingJobStart;
    });
  };
  
  const onSubmit = async (data: JobFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    const hasConflict = checkConflicts(data);
    if (hasConflict) {
      toast({
        variant: 'destructive',
        title: 'Scheduling Conflict',
        description: 'This team is already scheduled for a job at this exact date and time.',
      });
      return;
    }
    
    try {
      const team = teams.find(t => t.id === data.teamId);
      const teamName = team?.name || 'Unknown';
      
      const newJob: Job = {
        ...data,
        id: generateId(),
        status: 'Scheduled',
        createdBy: user.uid,
        createdAt: new Date(),
        teamName,
        notes: data.notes || '',
      };

      storage.saveJob(newJob);

      toast({
        title: 'Job Created',
        description: `Job #${data.contractNumber} has been scheduled successfully.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create job. Please try again.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="time" render={({ field }) => (
              <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>

        <FormField control={form.control} name="estimatedTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Time</FormLabel>
              <FormControl><Input placeholder="e.g., 4 hours" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField control={form.control} name="contractNumber" render={({ field }) => (
            <FormItem><FormLabel>Contract Number</FormLabel><FormControl><Input placeholder="e.g., C-12345" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />

        <FormField control={form.control} name="clientAddress" render={({ field }) => (
            <FormItem><FormLabel>Client Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <FormField control={form.control} name="clientPhone" render={({ field }) => (
            <FormItem><FormLabel>Client Phone</FormLabel><FormControl><Input type="tel" placeholder="555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="windowCount" render={({ field }) => (
              <FormItem><FormLabel>Windows</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="squareMeters" render={({ field }) => (
              <FormItem><FormLabel>Sq. Meters</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="circumference" render={({ field }) => (
              <FormItem><FormLabel>Circumference</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
        
        <FormField control={form.control} name="addons" render={() => (
            <FormItem>
              <FormLabel>Add-ons</FormLabel>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                {Object.keys(form.getValues().addons).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={`addons.${key as keyof JobFormValues['addons']}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any additional details..." {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />

        <FormField control={form.control} name="teamId" render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Team</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl>
                <SelectContent>
                  {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Create Job</Button>
      </form>
    </Form>
  );
}