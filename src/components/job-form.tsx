"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useTransition } from 'react';
import { collection, addDoc, getDocs, serverTimestamp, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Job, Team } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { WandSparkles, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { suggestEstimatedTime } from '@/ai/flows/suggest-estimated-time';
import { enhanceJobNotes } from '@/ai/flows/enhance-job-notes';


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
  const [isPending, startTransition] = useTransition();

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
  
  const { watch } = form;
  const watchedFieldsForEstimation = watch(["windowCount", "squareMeters", "circumference", "addons", "notes"]);


  useEffect(() => {
    const fetchTeams = async () => {
      const teamsCollection = collection(db, 'teams');
      const teamSnapshot = await getDocs(teamsCollection);
      setTeams(teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[]);
    };
    fetchTeams();
  }, []);

  const handleSuggestTime = async () => {
    startTransition(async () => {
      const [windowCount, squareMeters, circumference, addons, notes] = watchedFieldsForEstimation;
      if (!windowCount || !squareMeters || !circumference) {
        toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: 'Please fill in window count, square meters, and circumference to suggest a time.',
        });
        return;
      }
      
      try {
        const result = await suggestEstimatedTime({
          windowCount,
          squareMeters,
          circumference,
          addons,
          notes: notes || '',
        });
        form.setValue('estimatedTime', result.estimatedTime);
        toast({
          title: 'Time Suggested',
          description: `AI suggested an estimated time of ${result.estimatedTime}.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'AI Error',
          description: 'Could not suggest an estimated time.',
        });
      }
    });
  };

  const checkConflicts = async (newJob: JobFormValues): Promise<boolean> => {
    const q = query(
      collection(db, 'jobs'),
      where('teamId', '==', newJob.teamId),
      where('date', '==', newJob.date)
    );
    const querySnapshot = await getDocs(q);
    const jobsOnSameDay = querySnapshot.docs.map(doc => doc.data() as Job);
    
    // Basic time overlap check
    const newJobStart = new Date(`${newJob.date}T${newJob.time}`).getTime();
    return jobsOnSameDay.some(job => {
        const existingJobStart = new Date(`${job.date}T${job.time}`).getTime();
        // This is a very simple check, assuming jobs can't start at the exact same time.
        // A more robust check would consider job duration.
        return newJobStart === existingJobStart;
    });
  };
  
  const onSubmit = async (data: JobFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    startTransition(async () => {
      const hasConflict = await checkConflicts(data);
      if (hasConflict) {
        toast({
          variant: 'destructive',
          title: 'Scheduling Conflict',
          description: 'This team is already scheduled for a job at this exact date and time.',
        });
        return;
      }
      
      try {
        const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
        const teamName = teamDoc.exists() ? teamDoc.data().name : 'Unknown';
        
        const addonsList = Object.entries(data.addons)
            .filter(([, value]) => value)
            .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))
            .join(', ');

        const enhancedNotesResult = await enhanceJobNotes({
            notes: data.notes || '',
            contractNumber: data.contractNumber,
            clientAddress: data.clientAddress,
            windowCount: data.windowCount,
            squareMeters: data.squareMeters,
            circumference: data.circumference,
            addons: addonsList || 'None'
        });

        await addDoc(collection(db, 'jobs'), {
          ...data,
          status: 'Scheduled',
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          notes: enhancedNotesResult.enhancedNotes,
        });

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
    });
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
              <div className="flex gap-2">
                <FormControl><Input placeholder="e.g., 4 hours" {...field} /></FormControl>
                <Button type="button" variant="outline" onClick={handleSuggestTime} disabled={isPending}><WandSparkles className="h-4 w-4" /></Button>
              </div>
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
        <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Scheduling...' : 'Create Job'}</Button>
      </form>
    </Form>
  );
}
