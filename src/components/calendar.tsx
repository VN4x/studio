"use client";

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

  useEffect(() => {
    const fetchTeams = async () => {
      const teamsCollection = collection(db, 'teams');
      const teamSnapshot = await getDocs(teamsCollection);
      const teamList = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
      setTeams(teamList);
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    let q;
    if (user.role === 'manager') {
      q = query(collection(db, 'jobs'));
    } else {
      q = query(collection(db, 'jobs'), where('teamId', '==', user.teamId || ''));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const team = teams.find(t => t.id === data.teamId);
        return {
          id: doc.id,
          ...data,
          teamName: team?.name || 'Unknown Team',
        } as Job;
      });
      setJobs(jobsData);
    });

    return () => unsubscribe();
  }, [user, teams]);

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
        />
      )}
    </>
  );
}
