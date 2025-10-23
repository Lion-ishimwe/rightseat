// Initialize leave balances for existing staff members
import { LeaveAccrualService, type Client, type Staff } from './leaveAccrualService';
import { DailyAccrualTracker } from './dailyAccrualTracker';

export function initializeExistingStaffBalances(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const staffData = localStorage.getItem('staff_list');
    const clientsData = localStorage.getItem('leave_management_clients');
    
    if (!staffData || !clientsData) {
      console.log('No staff or client data found for initialization');
      return;
    }
    
    const staffList = JSON.parse(staffData);
    const clients: Client[] = JSON.parse(clientsData);
    const existingBalances = LeaveAccrualService.loadLeaveBalances();
    
    console.log(`Found ${staffList.length} staff members and ${clients.length} clients`);
    
    const newBalances = [];
    let initializedCount = 0;
    
    for (const staff of staffList) {
      // Check if this staff member already has a leave balance
      const existingBalance = existingBalances.find(b => b.employeeId === staff.id);
      
      if (!existingBalance && staff.status === 'Active') {
        // Find the client for this staff member
        const client = clients.find(c => c.id.toString() === (staff.clientId || '1'));
        
        if (client) {
          // Ensure staff has required fields with defaults for missing data
          const staffObj: Staff = {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            hireDate: staff.hireDate || '2024-01-01', // Default hire date if missing
            status: staff.status,
            clientId: staff.clientId || '1',
            gender: staff.gender || 'Male' // Default gender if missing
          };
          
          const newBalance = LeaveAccrualService.initializeLeaveBalance(staffObj, client);
          newBalances.push(newBalance);
          initializedCount++;
          
          console.log(`Initialized leave balance for ${staff.name} (${staff.gender || 'Male'}) with ${client.name} policies`);
        } else {
          console.warn(`No client found for staff member ${staff.name} (clientId: ${staff.clientId})`);
        }
      }
    }
    
    if (newBalances.length > 0) {
      const allBalances = [...existingBalances, ...newBalances];
      LeaveAccrualService.saveLeaveBalances(allBalances);
      console.log(`Successfully initialized leave balances for ${initializedCount} staff members`);
      
      // Run daily accrual update to ensure everything is current
      LeaveAccrualService.runDailyAccrualUpdate();
      console.log('Daily accrual update completed after initialization');
    } else {
      console.log('No new leave balances needed to be initialized');
    }
    
  } catch (error) {
    console.error('Error initializing existing staff balances:', error);
  }
}

// Also export a function to show current leave balance summary
export function showLeaveBalanceSummary(): void {
  if (typeof window === 'undefined') return;
  
  const balances = LeaveAccrualService.loadLeaveBalances();
  console.log('\n=== LEAVE BALANCE SUMMARY ===');
  console.log(`Total employees with leave balances: ${balances.length}`);
  
  balances.forEach(balance => {
    console.log(`\n${balance.employeeName} (ID: ${balance.employeeId})`);
    console.log(`  Hire Date: ${balance.hireDate}`);
    console.log(`  Last Accrual: ${balance.lastAccrualDate}`);
    console.log(`  Annual Leave: ${balance.leaveEntitlements.annualLeave.accrued.toFixed(2)}/${balance.leaveEntitlements.annualLeave.totalEntitled} accrued (${balance.leaveEntitlements.annualLeave.remaining.toFixed(2)} remaining)`);
    console.log(`  Sick Leave: ${balance.leaveEntitlements.sickLeave.accrued.toFixed(2)}/${balance.leaveEntitlements.sickLeave.totalEntitled} accrued (${balance.leaveEntitlements.sickLeave.remaining.toFixed(2)} remaining)`);
    
    if (balance.leaveEntitlements.maternityLeave) {
      console.log(`  Maternity Leave: ${balance.leaveEntitlements.maternityLeave.accrued}/${balance.leaveEntitlements.maternityLeave.totalEntitled} available`);
    }
    if (balance.leaveEntitlements.paternityLeave) {
      console.log(`  Paternity Leave: ${balance.leaveEntitlements.paternityLeave.accrued}/${balance.leaveEntitlements.paternityLeave.totalEntitled} available`);
    }
  });
  console.log('=== END SUMMARY ===\n');
}