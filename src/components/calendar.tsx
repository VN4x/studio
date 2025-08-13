"use client";

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { storage } from '@/lib/storage';
import type { AppUser, Job, Team } from '@/lib/types';
import JobDetails from './job-details';

const statusColors = {
  Scheduled: '#60A5FA', // blue-400
  Finished: '#34D399', // emerald-400
  'To Be Continued': '#FBBF24', // amber-400
  Problem: '#F87171', // red-400
};

interface CalendarProps {
  user: AppUser;
}

export default function Calendar({ user }: CalendarProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = useCallback(() => {
    const allTeams = storage.getTeams();
    setTeams(allTeams);

    let allJobs = storage.getJobs();
    
    // Filter jobs based on user role
    if (user.role === 'team' && user.teamId) {
      allJobs = allJobs.filter(job => job.teamId === user.teamId);
    }

    // Add team names to jobs
    const jobsWithTeamNames = allJobs.map(job => {
      const team = allTeams.find(t => t.id === job.teamId);
      return {
        ...job,
        teamName: team?.name || 'Unknown Team',
      };
    });

    setJobs(jobsWithTeamNames);
  }, [user]);

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh to catch updates from other components
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const calendarEvents = jobs.map((job) => ({
    id: job.id,
    title: `Job #${job.contractNumber}`,
    start: `${job.date}T${job.time}`,
    backgroundColor: statusColors[job.status],
    borderColor: statusColors[job.status],
    extendedProps: job,
  }));

  const handleEventClick = useCallback((clickInfo: any) => {
    setSelectedJob(clickInfo.event.extendedProps);
    setIsDetailsOpen(true);
  }, []);

  const handleJobUpdate = useCallback(() => {
    loadData(); // Refresh data when job is updated
  }, [loadData]);

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={calendarEvents}
        eventClick={handleEventClick}
        height="100%"
        contentHeight="auto"
        editable={false}
      />
      {selectedJob && (
        <JobDetails
          job={selectedJob}
          isOpen={isDetailsOpen}
          setIsOpen={setIsDetailsOpen}
          isManager={user.role === 'manager'}
          onUpdate={handleJobUpdate}
        />
      )}
    </>
  );
}