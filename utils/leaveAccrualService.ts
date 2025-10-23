// Leave Accrual Service - Handles automatic calculation of leave entitlements
export interface Client {
  id: number;
  name: string;
  annualLeave: number;
  sickLeave: number;
  personalLeave: number;
  maternityLeave: number;
  paternityLeave: number;
  studyLeave: number;
  createdAt: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  hireDate: string;
  status: string;
  clientId: string;
  gender?: string;
}

export interface LeaveBalance {
  employeeId: number;
  employeeName: string;
  clientId: string;
  hireDate: string;
  lastAccrualDate: string;
  leaveEntitlements: {
    annualLeave: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
    sickLeave: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
    personalLeave: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
    maternityLeave?: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
    paternityLeave?: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
    studyLeave: {
      totalEntitled: number;
      accrued: number;
      used: number;
      remaining: number;
      accruedToDate: number;
    };
  };
}

export class LeaveAccrualService {
  private static readonly WORKING_DAYS_PER_YEAR = 251; // Standard working days in Rwanda (365 - 104 weekend days - 10 public holidays)
  
  /**
   * Initialize leave balance for a new staff member based on client policy
   */
  static initializeLeaveBalance(staff: Staff, client: Client): LeaveBalance {
    const hireDate = new Date(staff.hireDate);
    const today = new Date();
    
    // Calculate accrued annual leave based on days worked since hire date
    const accruedAnnualLeave = this.calculateAccruedAnnualLeave(hireDate, today, client.annualLeave);
    
    const leaveBalance: LeaveBalance = {
      employeeId: staff.id,
      employeeName: staff.name,
      clientId: staff.clientId,
      hireDate: staff.hireDate,
      lastAccrualDate: today.toISOString().split('T')[0],
      leaveEntitlements: {
        annualLeave: {
          totalEntitled: client.annualLeave,
          accrued: accruedAnnualLeave,
          used: 0,
          remaining: accruedAnnualLeave,
          accruedToDate: accruedAnnualLeave
        },
        // Other leave types are granted in full immediately
        sickLeave: {
          totalEntitled: client.sickLeave,
          accrued: client.sickLeave, // Full allocation immediately
          used: 0,
          remaining: client.sickLeave,
          accruedToDate: client.sickLeave
        },
        personalLeave: {
          totalEntitled: client.personalLeave,
          accrued: client.personalLeave, // Full allocation immediately
          used: 0,
          remaining: client.personalLeave,
          accruedToDate: client.personalLeave
        },
        studyLeave: {
          totalEntitled: client.studyLeave,
          accrued: client.studyLeave, // Full allocation immediately
          used: 0,
          remaining: client.studyLeave,
          accruedToDate: client.studyLeave
        }
      }
    };

    // Add gender-specific leave types (always granted in full)
    if (staff.gender?.toLowerCase() === 'female') {
      leaveBalance.leaveEntitlements.maternityLeave = {
        totalEntitled: client.maternityLeave,
        accrued: client.maternityLeave, // Full allocation immediately
        used: 0,
        remaining: client.maternityLeave,
        accruedToDate: client.maternityLeave
      };
    } else if (staff.gender?.toLowerCase() === 'male') {
      leaveBalance.leaveEntitlements.paternityLeave = {
        totalEntitled: client.paternityLeave,
        accrued: client.paternityLeave, // Full allocation immediately
        used: 0,
        remaining: client.paternityLeave,
        accruedToDate: client.paternityLeave
      };
    }

    return leaveBalance;
  }

  /**
   * Calculate accrued annual leave amount based on working days since hire
   * ONLY annual leave accrues daily - other leave types are granted in full
   */
  private static calculateAccruedAnnualLeave(hireDate: Date, currentDate: Date, annualLeaveEntitlement: number): number {
    const workingDaysSinceHire = this.calculateWorkingDays(hireDate, currentDate);
    const totalWorkingDaysInYear = this.WORKING_DAYS_PER_YEAR;

    // Calculate daily accrual rate for annual leave only
    const annualDailyRate = annualLeaveEntitlement / totalWorkingDaysInYear;

    return Math.min(
      Math.floor(workingDaysSinceHire * annualDailyRate * 100) / 100, // Round to 2 decimal places
      annualLeaveEntitlement
    );
  }

  /**
   * Calculate working days between two dates (excluding weekends and public holidays)
   */
  static calculateWorkingDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let workingDays = 0;
    const currentDate = new Date(start);

    // Rwanda public holidays (month is 0-indexed)
    const publicHolidays = [
      { month: 0, day: 1 },   // New Year's Day
      { month: 1, day: 1 },   // Liberation Day  
      { month: 2, day: 8 },   // International Women's Day
      { month: 6, day: 1 },   // Independence Day
      { month: 7, day: 15 },  // Assumption Day
      { month: 9, day: 1 },   // Patriots' Day
      { month: 11, day: 25 }, // Christmas Day
      { month: 11, day: 26 }  // Boxing Day
    ];

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if it's a weekday (Monday=1 to Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Check if it's not a public holiday
        const isPublicHoliday = publicHolidays.some(holiday => 
          currentDate.getMonth() === holiday.month && currentDate.getDate() === holiday.day
        );
        
        if (!isPublicHoliday) {
          workingDays++;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Update leave balances daily - calculates new accruals
   */
  static updateDailyAccruals(currentBalances: LeaveBalance[], clients: Client[]): LeaveBalance[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return currentBalances.map(balance => {
      const client = clients.find(c => c.id.toString() === balance.clientId);
      if (!client) return balance;

      // Check if already updated today
      if (balance.lastAccrualDate === todayStr) {
        return balance;
      }

      const hireDate = new Date(balance.hireDate);
      const lastAccrualDate = new Date(balance.lastAccrualDate);
      
      // Calculate working days since last accrual
      const workingDaysSinceLastAccrual = this.calculateWorkingDays(lastAccrualDate, today);
      
      if (workingDaysSinceLastAccrual === 0) {
        // No working days since last accrual, just update the date
        return {
          ...balance,
          lastAccrualDate: todayStr
        };
      }

      // Calculate total accrued annual leave from hire date to today (ONLY annual leave accrues daily)
      const totalAccruedAnnualLeave = this.calculateAccruedAnnualLeave(hireDate, today, client.annualLeave);

      // Update the balance with new accrued amounts (ONLY annual leave is updated daily)
      const updatedBalance: LeaveBalance = {
        ...balance,
        lastAccrualDate: todayStr,
        leaveEntitlements: {
          ...balance.leaveEntitlements,
          annualLeave: {
            ...balance.leaveEntitlements.annualLeave,
            accrued: totalAccruedAnnualLeave,
            remaining: Math.max(0, totalAccruedAnnualLeave - balance.leaveEntitlements.annualLeave.used),
            accruedToDate: totalAccruedAnnualLeave
          }
          // Other leave types (sick, personal, study, maternity, paternity) remain unchanged
          // They are granted in full and don't accrue daily
        }
      };

      return updatedBalance;
    });
  }

  /**
   * Get leave balance for a specific employee
   */
  static getEmployeeLeaveBalance(employeeId: number): LeaveBalance | null {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem('leave_balances');
    if (!saved) return null;

    try {
      const balances: LeaveBalance[] = JSON.parse(saved);
      return balances.find(balance => balance.employeeId === employeeId) || null;
    } catch {
      return null;
    }
  }

  /**
   * Save leave balances to localStorage
   */
  static saveLeaveBalances(balances: LeaveBalance[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leave_balances', JSON.stringify(balances));
    }
  }

  /**
   * Load leave balances from localStorage
   */
  static loadLeaveBalances(): LeaveBalance[] {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem('leave_balances');
    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  /**
   * Process leave usage - deduct from balance
   */
  static processLeaveUsage(
    employeeId: number, 
    leaveType: string, 
    daysUsed: number
  ): boolean {
    const balances = this.loadLeaveBalances();
    const balance = balances.find(b => b.employeeId === employeeId);
    
    if (!balance) return false;

    let leaveCategory: any;
    switch (leaveType.toLowerCase()) {
      case 'annual leave':
        leaveCategory = balance.leaveEntitlements.annualLeave;
        break;
      case 'sick leave':
        leaveCategory = balance.leaveEntitlements.sickLeave;
        break;
      case 'personal leave':
        leaveCategory = balance.leaveEntitlements.personalLeave;
        break;
      case 'maternity leave':
        leaveCategory = balance.leaveEntitlements.maternityLeave;
        break;
      case 'paternity leave':
        leaveCategory = balance.leaveEntitlements.paternityLeave;
        break;
      case 'study leave':
        leaveCategory = balance.leaveEntitlements.studyLeave;
        break;
      default:
        return false;
    }

    if (!leaveCategory || leaveCategory.remaining < daysUsed) {
      return false; // Insufficient balance
    }

    // Update the leave category
    leaveCategory.used += daysUsed;
    leaveCategory.remaining = Math.max(0, leaveCategory.accrued - leaveCategory.used);

    // Save updated balances
    const updatedBalances = balances.map(b => 
      b.employeeId === employeeId ? balance : b
    );
    
    this.saveLeaveBalances(updatedBalances);
    return true;
  }

  /**
   * Get formatted leave summary for display
   */
  static getLeaveDisplaySummary(employeeId: number): any {
    const balance = this.getEmployeeLeaveBalance(employeeId);
    if (!balance) return null;

    const entitlements = balance.leaveEntitlements;
    const summary = [];

    // Always include basic leave types
    summary.push({
      type: 'Annual Leave',
      total: entitlements.annualLeave.totalEntitled,
      accrued: entitlements.annualLeave.accruedToDate,
      used: entitlements.annualLeave.used,
      remaining: entitlements.annualLeave.remaining
    });

    summary.push({
      type: 'Sick Leave', 
      total: entitlements.sickLeave.totalEntitled,
      accrued: entitlements.sickLeave.accruedToDate,
      used: entitlements.sickLeave.used,
      remaining: entitlements.sickLeave.remaining
    });

    summary.push({
      type: 'Personal Leave',
      total: entitlements.personalLeave.totalEntitled,
      accrued: entitlements.personalLeave.accruedToDate,
      used: entitlements.personalLeave.used,
      remaining: entitlements.personalLeave.remaining
    });

    summary.push({
      type: 'Study Leave',
      total: entitlements.studyLeave.totalEntitled,
      accrued: entitlements.studyLeave.accruedToDate,
      used: entitlements.studyLeave.used,
      remaining: entitlements.studyLeave.remaining
    });

    // Add gender-specific leave types if applicable
    if (entitlements.maternityLeave) {
      summary.push({
        type: 'Maternity Leave',
        total: entitlements.maternityLeave.totalEntitled,
        accrued: entitlements.maternityLeave.accruedToDate,
        used: entitlements.maternityLeave.used,
        remaining: entitlements.maternityLeave.remaining
      });
    }

    if (entitlements.paternityLeave) {
      summary.push({
        type: 'Paternity Leave',
        total: entitlements.paternityLeave.totalEntitled,
        accrued: entitlements.paternityLeave.accruedToDate,
        used: entitlements.paternityLeave.used,
        remaining: entitlements.paternityLeave.remaining
      });
    }

    return {
      employeeName: balance.employeeName,
      lastUpdated: balance.lastAccrualDate,
      leaveTypes: summary
    };
  }

  /**
   * Run daily accrual update for all employees
   */
  static runDailyAccrualUpdate(): void {
    if (typeof window === 'undefined') return;

    const balances = this.loadLeaveBalances();
    const clientsData = localStorage.getItem('leave_management_clients');
    
    if (!clientsData || balances.length === 0) return;

    try {
      const clients: Client[] = JSON.parse(clientsData);
      const updatedBalances = this.updateDailyAccruals(balances, clients);
      this.saveLeaveBalances(updatedBalances);
      
      console.log(`Daily leave accrual updated for ${updatedBalances.length} employees`);
    } catch (error) {
      console.error('Error running daily accrual update:', error);
    }
  }
}

// Auto-run daily accrual update when service is imported (client-side only)
if (typeof window !== 'undefined') {
  // Run immediately
  LeaveAccrualService.runDailyAccrualUpdate();

  // Set up daily update at midnight
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    LeaveAccrualService.runDailyAccrualUpdate();
    
    // Then run every 24 hours
    setInterval(() => {
      LeaveAccrualService.runDailyAccrualUpdate();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
}