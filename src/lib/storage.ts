import type { Job, Team, AppUser } from './types';

// Local storage keys
const STORAGE_KEYS = {
  JOBS: 'clearvue_jobs',
  TEAMS: 'clearvue_teams',
  USERS: 'clearvue_users',
  CURRENT_USER: 'clearvue_current_user'
};

// Initialize default data
const initializeDefaultData = () => {
  // Default teams
  const defaultTeams: Team[] = [
    { id: 'team-1', name: 'Alpha Team' },
    { id: 'team-2', name: 'Beta Team' },
    { id: 'team-3', name: 'Gamma Team' }
  ];

  // Default users
  const defaultUsers: AppUser[] = [
    {
      uid: 'manager-1',
      email: 'manager@clearvue.dev',
      name: 'John Manager',
      role: 'manager'
    },
    {
      uid: 'team-1-user',
      email: 'team@clearvue.dev',
      name: 'Alice Worker',
      role: 'team',
      teamId: 'team-1'
    }
  ];

  // Default jobs
  const defaultJobs: Job[] = [
    {
      id: 'job-1',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      estimatedTime: '4 hours',
      contractNumber: 'C-12345',
      clientAddress: '123 Main St, Anytown',
      clientPhone: '555-123-4567',
      windowCount: 8,
      squareMeters: 25.5,
      circumference: 48.2,
      addons: {
        innerSills: true,
        outerSills: false,
        finishing: true,
        tape: false,
        extras: false
      },
      notes: 'Standard installation with inner sills and finishing work required.',
      status: 'Scheduled',
      teamId: 'team-1',
      teamName: 'Alpha Team',
      createdBy: 'manager-1',
      createdAt: new Date()
    },
    {
      id: 'job-2',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      time: '14:00',
      estimatedTime: '6 hours',
      contractNumber: 'C-12346',
      clientAddress: '456 Oak Ave, Somewhere',
      clientPhone: '555-987-6543',
      windowCount: 12,
      squareMeters: 38.7,
      circumference: 72.1,
      addons: {
        innerSills: true,
        outerSills: true,
        finishing: true,
        tape: true,
        extras: false
      },
      notes: 'Large installation project with full add-ons package.',
      status: 'Scheduled',
      teamId: 'team-2',
      teamName: 'Beta Team',
      createdBy: 'manager-1',
      createdAt: new Date()
    }
  ];

  // Initialize storage if empty
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(defaultTeams));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(defaultJobs));
  }
};

// Storage utilities
export const storage = {
  // Jobs
  getJobs: (): Job[] => {
    const jobs = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (!jobs) return [];
    return JSON.parse(jobs).map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt)
    }));
  },

  saveJob: (job: Job): void => {
    const jobs = storage.getJobs();
    const existingIndex = jobs.findIndex(j => j.id === job.id);
    
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }
    
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },

  updateJob: (jobId: string, updates: Partial<Job>): void => {
    const jobs = storage.getJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex >= 0) {
      jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    }
  },

  // Teams
  getTeams: (): Team[] => {
    const teams = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return teams ? JSON.parse(teams) : [];
  },

  // Users
  getUsers: (): AppUser[] => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  },

  getUserByEmail: (email: string): AppUser | null => {
    const users = storage.getUsers();
    return users.find(user => user.email === email) || null;
  },

  // Current user session
  setCurrentUser: (user: AppUser): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getCurrentUser: (): AppUser | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  clearCurrentUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Initialize default data on module load
initializeDefaultData();