'use client';

import HROutsourcingDashboard from "../../components/HROutsourcingDashboard";
import { requireHRAccess } from "../../lib/middleware/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HROutsourcingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check user role and redirect if needed
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user.role === 'employee') {
            // Redirect employees to their info page
            router.push('/hr-outsourcing/my-info');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, [router]);

  return <HROutsourcingDashboard />;
}