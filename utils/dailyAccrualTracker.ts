import { LeaveAccrualService, type Client } from './leaveAccrualService';

export class DailyAccrualTracker {
  private static readonly STORAGE_KEY = 'last_accrual_run';
  
  /**
   * Check if daily accrual should run and execute if needed
   */
  static checkAndRunDailyAccrual(): void {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastRun = localStorage.getItem(this.STORAGE_KEY);
    
    // Run if never run before or if it's a new day
    if (!lastRun || lastRun !== today) {
      this.runDailyAccrual();
      localStorage.setItem(this.STORAGE_KEY, today);
      console.log(`Daily leave accrual completed for ${today}`);
    }
  }
  
  /**
   * Execute daily accrual for all employees
   */
  private static runDailyAccrual(): void {
    try {
      // Run the daily accrual update
      LeaveAccrualService.runDailyAccrualUpdate();
      
      // Initialize leave balances for any staff members who don't have them
      this.initializeMissingBalances();
      
      // Log completion
      const balances = LeaveAccrualService.loadLeaveBalances();
      console.log(`Daily accrual processed for ${balances.length} employees`);
      
    } catch (error) {
      console.error('Error running daily accrual:', error);
    }
  }
  
  /**
   * Initialize leave balances for staff members who don't have them yet
   */
  static initializeMissingBalances(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const staffData = localStorage.getItem('staff_list');
      const clientsData = localStorage.getItem('leave_management_clients');
      
      if (!staffData || !clientsData) return;
      
      const staffList = JSON.parse(staffData);
      const clients = JSON.parse(clientsData);
      const existingBalances = LeaveAccrualService.loadLeaveBalances();
      
      const newBalances = [];
      
      for (const staff of staffList) {
        // Check if this staff member already has a leave balance
        const existingBalance = existingBalances.find(b => b.employeeId === staff.id);
        
        if (!existingBalance && staff.status === 'Active') {
          // Find the client for this staff member
          const client = clients.find((c: Client) => c.id.toString() === staff.clientId);
          
          if (client) {
            // Create staff object with required fields
            const staffObj = {
              id: staff.id,
              name: staff.name,
              email: staff.email,
              hireDate: staff.hireDate,
              status: staff.status,
              clientId: staff.clientId,
              gender: staff.gender
            };
            
            const newBalance = LeaveAccrualService.initializeLeaveBalance(staffObj, client);
            newBalances.push(newBalance);
            
            console.log(`Initialized leave balance for ${staff.name}`);
          }
        }
      }
      
      if (newBalances.length > 0) {
        const allBalances = [...existingBalances, ...newBalances];
        LeaveAccrualService.saveLeaveBalances(allBalances);
        console.log(`Initialized leave balances for ${newBalances.length} new employees`);
      }
      
    } catch (error) {
      console.error('Error initializing missing balances:', error);
    }
  }
  
  /**
   * Force refresh all leave balances (useful for manual updates)
   */
  static forceRefreshAllBalances(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const clientsData = localStorage.getItem('leave_management_clients');
      if (!clientsData) return;
      
      const clients = JSON.parse(clientsData);
      const balances = LeaveAccrualService.loadLeaveBalances();
      
      const updatedBalances = LeaveAccrualService.updateDailyAccruals(balances, clients);
      LeaveAccrualService.saveLeaveBalances(updatedBalances);
      
      console.log('Force refreshed all leave balances');
    } catch (error) {
      console.error('Error force refreshing balances:', error);
    }
  }
  
  /**
   * Get accrual statistics for dashboard
   */
  static getAccrualStats(): {
    totalEmployeesWithBalances: number;
    lastAccrualDate: string | null;
    totalDaysAccruedToday: number;
  } {
    const balances = LeaveAccrualService.loadLeaveBalances();
    const lastRun = localStorage.getItem(this.STORAGE_KEY);
    
    let totalDaysAccruedToday = 0;
    const today = new Date().toISOString().split('T')[0];
    
    balances.forEach(balance => {
      if (balance.lastAccrualDate === today) {
        // Calculate daily accrual (approximation)
        const hireDate = new Date(balance.hireDate);
        const daysEmployed = LeaveAccrualService.calculateWorkingDays(hireDate, new Date());
        if (daysEmployed > 0) {
          totalDaysAccruedToday += 0.1; // Rough estimate
        }
      }
    });
    
    return {
      totalEmployeesWithBalances: balances.length,
      lastAccrualDate: lastRun,
      totalDaysAccruedToday: Math.round(totalDaysAccruedToday * 100) / 100
    };
  }
}

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  // Check and run daily accrual on page load
  setTimeout(() => {
    DailyAccrualTracker.checkAndRunDailyAccrual();
  }, 1000); // Delay to ensure localStorage is ready
  
  // Set up periodic checks (every hour)
  setInterval(() => {
    DailyAccrualTracker.checkAndRunDailyAccrual();
  }, 60 * 60 * 1000);
}